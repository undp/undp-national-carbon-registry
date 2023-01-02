import React, { FC } from 'react';
import moment from 'moment';
import './stasticCard.scss';
import { FieldTimeOutlined } from '@ant-design/icons';
import clockHistory from '../../Assets/Images/clockHistory.svg';
import envelopeCheck from '../../Assets/Images/envelopeCheck.svg';
import coin from '../../Assets/Images/coin.svg';

export interface StasticCardItemProps {
  value: number;
  title: string;
  updatedDate: any;
  icon: string;
}

const StasticCard: FC<StasticCardItemProps> = (props: StasticCardItemProps) => {
  const { value, title, updatedDate, icon } = props;

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
      <div className="values-section">
        <div className="title">{title}</div>
        <div className="details-section value">{value}</div>
        <div className="updated-on">{moment(parseInt(updatedDate) * 1000).fromNow()}</div>
      </div>
      <div className="icon-section">
        {icon === 'clockHistory' && <img src={clockHistory} />}
        {icon === 'envelopeCheck' && <img src={envelopeCheck} />}
        {icon === 'coin' && <img src={coin} />}
        {/* <FieldTimeOutlined
          style={{
            color: '#16B1FF',
            fontSize: '100px',
          }}
        /> */}
      </div>
    </div>
  );
};

export default StasticCard;
