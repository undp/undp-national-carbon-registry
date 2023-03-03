import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MapComponentProps,
  MarkerData,
} from '../../Definitions/InterfacesAndType/mapComponent.definitions';

mapboxgl.accessToken = process.env.MAPBOXGL_ACCESS_TOKEN
  ? process.env.MAPBOXGL_ACCESS_TOKEN
  : '';

const MapboxComponent = (props: MapComponentProps) => {
  const mapContainerRef = useRef(null);
  const {
    center,
    markers,
    mapSource,
    onClick,
    showPopupOnClick,
    clickedPopupData,
    onMouseMove,
    layer,
    height,
    style,
    zoom,
  } = props;

  useEffect(() => {
    if (!mapContainerRef || !mapContainerRef.current || center.length !== 2) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current || '',
      style: style,
      center: [center[0], center[1]],
      zoom: zoom,
    });

    map.on('load', () => {
      if (mapSource) {
        map.addSource(mapSource.key, mapSource.data);
      }

      if (onClick) {
        map.on('click', function (e) {
          onClick(map, e);
          if (showPopupOnClick && clickedPopupData) {
            const popup = new mapboxgl.Popup()
              .setLngLat(map.unproject(e.point))
              .setHTML(clickedPopupData.html)
              .addTo(map);
          }
        });
      }

      if (onMouseMove) {
        map.on('mousemove', function (e) {
          onMouseMove(map, e);
        });
      }

      if (layer) {
        map.addLayer(layer);
      }
    });

    if (markers) {
      markers.forEach((marker: MarkerData) => {
        new mapboxgl.Marker({
          color: marker.color,
          element: marker.element ? marker.element : undefined,
        })
          .setLngLat([marker.location[0], marker.location[1]])
          .addTo(map);
      });
    }
  });

  return (
    <div
      className="map-box-container"
      style={{ width: '100%', height: `${height}px` }}
      ref={mapContainerRef}
    />
  );
};

export default MapboxComponent;
