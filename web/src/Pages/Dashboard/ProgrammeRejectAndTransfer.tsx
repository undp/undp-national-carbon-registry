import React, { FC } from 'react';
import { DatePicker, Progress, Skeleton } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import fileText from '../../Assets/Images/fileText.svg';
import { CarOutlined, CloseCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;

const Map = ReactMapboxGl({
  accessToken:
    'pk.eyJ1IjoiZmFicmljOCIsImEiOiJjaWc5aTV1ZzUwMDJwdzJrb2w0dXRmc2d0In0.p6GGlfyV-WksaDV_KdN27A',
});

export interface ProgrammeRejectAndTransferCardItemProps {
  totalPrgrammes: number;
  issued: number;
  rejected: number;
  transfered: number;
  updatedDate: any;
  loading: boolean;
}

const ProgrammeRejectAndTransfer: FC<ProgrammeRejectAndTransferCardItemProps> = (
  props: ProgrammeRejectAndTransferCardItemProps
) => {
  const { totalPrgrammes, issued, rejected, transfered, updatedDate, loading } = props;
  return (
    <div className="stastics-and-pie-card height-pie-rem">
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="total-programme-details">
            <div className="details">
              <div className="title">Programmes</div>
              <div className="detail">Issued</div>
              <div className="value">{issued}</div>
            </div>
            <div className="icon">
              <img src={fileText} />
            </div>
          </div>
          <div className="total-programme-extra-details">
            <div className="rejected-details margin-top-1">
              <div className="icon">
                <div className="icon-container reject">
                  <CloseCircleOutlined
                    style={{
                      color: '#FF4C51',
                      fontSize: '25px',
                    }}
                  />
                </div>
              </div>
              <div className="details">
                <div className="label-and-value">
                  <div className="label">Rejected</div>
                  <div className="value">{rejected}</div>
                </div>
                <div className="stastic-bar">
                  <Progress
                    showInfo={false}
                    percent={(rejected / totalPrgrammes) * 100}
                    status="active"
                    strokeColor={{ from: '#FFA6A6', to: '#FF4D4F' }}
                  />
                </div>
              </div>
            </div>
            <div className="transfered-details margin-top-1">
              <div className="icon">
                <div className="icon-container transfer">
                  <CarOutlined
                    style={{
                      color: '#FF8F56',
                      fontSize: '25px',
                    }}
                  />
                </div>
              </div>
              <div className="details">
                <div className="label-and-value">
                  <div className="label">Transferred</div>
                  <div className="value">{transfered}</div>
                </div>
                <div className="stastic-bar">
                  <Progress
                    showInfo={false}
                    percent={(transfered / totalPrgrammes) * 100}
                    status="active"
                    strokeColor={{ from: '#FAE07F', to: '#FF8F56' }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="updated-on margin-top-4">
            <div className="updated-moment-container">{moment(updatedDate * 1000).fromNow()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProgrammeRejectAndTransfer;
