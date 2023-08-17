import React, { FC } from 'react';
import { Skeleton, Tooltip } from 'antd';
import Chart from 'react-apexcharts';
import { InfoCircle } from 'react-bootstrap-icons';
import moment from 'moment';
import { LegendItem, MapComponent } from '@undp/carbon-library';

export interface MapStatsProps {
  id: string;
  title: string;
  lastUpdate: any;
  loading: boolean;
  toolTipText: string;
  mapType: string;
  mapCenter: any;
  mapZoom: number;
  dataSource: any;
  mapLayer: any;
  renderCB: any;
  style: string;
  labels: string[];
  colors: string[];
}

const MapStats: FC<MapStatsProps> = (props: MapStatsProps) => {
  const {
    title,
    lastUpdate,
    loading,
    toolTipText,
    mapType,
    mapCenter,
    mapZoom,
    dataSource,
    mapLayer,
    renderCB,
    style,
    labels,
    colors,
  } = props;

  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  return (
    <div className="stastics-and-pie-card height-map-rem">
      <div className="pie-charts-top">
        <div className="pie-charts-title">{title}</div>
        <div className="info-container">
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
      </div>
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="map-content">
            <MapComponent
              mapType={mapType}
              center={mapCenter}
              zoom={mapZoom}
              mapSource={dataSource}
              layer={mapLayer}
              height={360}
              style={style}
              onRender={renderCB}
              accessToken={accessToken}
            ></MapComponent>
          </div>
          <div className="stage-legends">
            {labels.map((item, index) => {
              return <LegendItem text={item} color={colors[index]} />;
            })}
          </div>
          <div className="updated-on margin-top-1">
            <div className="updated-moment-container">{lastUpdate !== '0' && lastUpdate}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default MapStats;
