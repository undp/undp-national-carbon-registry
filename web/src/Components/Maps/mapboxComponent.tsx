import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import {
  MapComponentProps,
  MarkerData,
} from '../../Definitions/Definitions/mapComponent.definitions';
import './mapboxComponent.scss';

export const MapboxComponent = (props: MapComponentProps) => {
  const mapContainerRef = useRef(null);

  const {
    center,
    markers,
    mapSource,
    onClick,
    showPopupOnClick,
    onMouseMove,
    layer,
    height,
    style,
    zoom,
    onRender,
    accessToken,
    onPolygonComplete,
    outlineLayer,
  } = props;

  mapboxgl.accessToken = accessToken;

  useEffect(() => {
    if (!mapContainerRef || !mapContainerRef.current || center.length !== 2) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current || '',
      style: style,
      center:
        !Number.isNaN(center[0]) && !Number.isNaN(center[1])
          ? [center[0], center[1]]
          : [9.082, 8.6753],
      zoom: zoom,
      maxZoom: 17,
    });

    if (onPolygonComplete) {
      const draw: any = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'draw_polygon',
      });

      map.addControl(draw);
      map.on('draw.create', (e) => {
        const data = draw.getAll();
        console.log('draw.create called');
        onPolygonComplete(data);
      });
    }

    map.on('load', () => {
      const currentMarkes: any = {};

      if (mapSource) {
        map.addSource(mapSource.key, mapSource.data);
      }

      if (onClick) {
        map.on('click', function (e) {
          const popupContent = onClick(map, e);
          if (showPopupOnClick && popupContent) {
            const popup = new mapboxgl.Popup()
              .setLngLat(map.unproject(e.point))
              .setHTML(popupContent)
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

      if (outlineLayer) {
        map.addLayer(outlineLayer);
      }

      if (onRender) {
        map.on('render', () => {
          const markersList: MarkerData[] = onRender(map);
          if (markersList) {
            markersList.forEach((marker: MarkerData) => {
              if (!currentMarkes[marker.id as number]) {
                const createdMarker = new mapboxgl.Marker({
                  color: marker.color,
                  element: marker.element ? marker.element : undefined,
                })
                  .setLngLat([marker.location[0], marker.location[1]])
                  .addTo(map);
                currentMarkes[marker.id as number] = createdMarker;
              }
            });

            for (const id in currentMarkes) {
              if (!markersList?.some((marker: MarkerData) => marker.id?.toString() === id)) {
                currentMarkes[id].remove();
                delete currentMarkes[id];
              }
            }
          }
        });
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
