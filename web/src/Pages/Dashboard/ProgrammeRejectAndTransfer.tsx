import React from 'react';
import { DatePicker, Progress } from 'antd';
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

const ProgrammeRejectAndTransfer = () => {
  return (
    <div className="stastics-and-pie-card">
      <div className="total-programme-details">
        <div className="details">
          <div className="title">Programmes</div>
          <div className="detail">Issued</div>
          <div className="value">855</div>
        </div>
        <div className="icon">
          <img src={fileText} />
        </div>
      </div>
      <div className="total-programme-extra-details">
        <div className="rejected-details">
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
              <div className="value">20</div>
            </div>
            <div className="stastic-bar">
              <Progress
                showInfo={false}
                percent={30}
                status="active"
                strokeColor={{ from: '#FFA6A6', to: '#FF4D4F' }}
              />
            </div>
          </div>
        </div>
        <div className="transfered-details">
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
              <div className="value">75</div>
            </div>
            <div className="stastic-bar">
              <Progress
                showInfo={false}
                percent={75}
                status="active"
                strokeColor={{ from: '#FAE07F', to: '#FF8F56' }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="updated-on">
        <div className="updated-moment-container">
          {moment(parseInt('1672648015') * 1000).fromNow()}
        </div>
      </div>
    </div>
  );
};

export default ProgrammeRejectAndTransfer;
