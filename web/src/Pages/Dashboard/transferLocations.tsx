import React, { FC, useEffect, useRef } from 'react';
import { DatePicker, Progress, Skeleton } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import moment from 'moment';
import mapboxgl from 'mapbox-gl';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding';

const { RangePicker } = DatePicker;

mapboxgl.accessToken =
  '';

export interface TransferLocationsMapProps {
  programmeLocations: any;
  lastUpdate: number;
  loading: boolean;
}

const TransferLocationsMap: FC<TransferLocationsMapProps> = (props: TransferLocationsMapProps) => {
  const { programmeLocations, lastUpdate, loading } = props;
  const mapContainerInternationalRef = useRef(null);
  useEffect(() => {
    // filters for classifying earthquakes into five categories based on magnitude
    const mag1 = ['<', ['get', 'mag'], 2];
    const mag2 = ['all', ['>=', ['get', 'mag'], 2], ['<', ['get', 'mag'], 3]];
    const mag3 = ['all', ['>=', ['get', 'mag'], 3], ['<', ['get', 'mag'], 4]];
    const mag4 = ['all', ['>=', ['get', 'mag'], 4], ['<', ['get', 'mag'], 5]];
    const mag5 = ['>=', ['get', 'mag'], 5];

    // colors to use for the categories
    const colors = ['#33adff', '#4db8ff', '#80ccff', '#99d6ff', '#ccebff'];

    function donutSegment(start: any, end: any, r: any, r0: any, color: any) {
      if (end - start === 1) end -= 0.00001;
      const a0 = 2 * Math.PI * (start - 0.25);
      const a1 = 2 * Math.PI * (end - 0.25);
      const x0 = Math.cos(a0),
        y0 = Math.sin(a0);
      const x1 = Math.cos(a1),
        y1 = Math.sin(a1);
      const largeArc = end - start > 0.5 ? 1 : 0;

      // draw an SVG path
      return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
        r + r * y0
      } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
        r + r0 * y1
      } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${r + r0 * y0}" fill="${color}" />`;
    }

    // code for creating an SVG donut chart from feature properties
    function createDonutChart(properties: any) {
      const offsets = [];
      const counts = [
        properties.mag1,
        properties.mag2,
        properties.mag3,
        properties.mag4,
        properties.mag5,
      ];
      let total = 0;
      for (const count of counts) {
        offsets.push(total);
        total += count;
      }
      const fontSize = total >= 1000 ? 22 : total >= 100 ? 20 : total >= 10 ? 18 : 16;
      const r = total >= 1000 ? 50 : total >= 100 ? 32 : total >= 10 ? 24 : 18;
      const r0 = Math.round(r * 0.6);
      const w = r * 2;

      let html = `<div>
  <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

      for (let i = 0; i < counts.length; i++) {
        html += donutSegment(
          offsets[i] / total,
          (offsets[i] + counts[i]) / total,
          r,
          r0,
          colors[i]
        );
      }
      html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
  <text dominant-baseline="central" transform="translate(${r}, ${r})">
  ${total.toLocaleString()}
  </text>
  </svg>
  </div>`;

      const el = document.createElement('div');
      el.innerHTML = html;
      return el.firstChild;
    }

    setTimeout(() => {
      if (mapContainerInternationalRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerInternationalRef.current || '',
          zoom: 0.5,
          center: [0, 20],
          // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
          style: 'mapbox://styles/mapbox/light-v11',
        });
        map.on('load', () => {
          // add a clustered GeoJSON source for a sample set of earthquakes
          map.addSource('earthquakes', {
            type: 'geojson',
            data: 'https://docs.mapbox.com/mapbox-gl-js/assets/earthquakes.geojson',
            cluster: true,
            clusterRadius: 80,
            clusterProperties: {
              // keep separate counts for each magnitude category in a cluster
              mag1: ['+', ['case', mag1, 1, 0]],
              mag2: ['+', ['case', mag2, 1, 0]],
              mag3: ['+', ['case', mag3, 1, 0]],
              mag4: ['+', ['case', mag4, 1, 0]],
              mag5: ['+', ['case', mag5, 1, 0]],
            },
          });
          // circle and symbol layers for rendering individual earthquakes (unclustered points)
          map.addLayer({
            id: 'earthquake_circle',
            type: 'circle',
            source: 'earthquakes',
            filter: ['!=', 'cluster', true],
            paint: {
              'circle-color': [
                'case',
                mag1,
                colors[0],
                mag2,
                colors[1],
                mag3,
                colors[2],
                mag4,
                colors[3],
                colors[4],
              ],
              'circle-opacity': 0.6,
              'circle-radius': 12,
            },
          });
          map.addLayer({
            id: 'earthquake_label',
            type: 'symbol',
            source: 'earthquakes',
            filter: ['!=', 'cluster', true],
            layout: {
              'text-field': [
                'number-format',
                ['get', 'mag'],
                { 'min-fraction-digits': 1, 'max-fraction-digits': 1 },
              ],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 10,
            },
            paint: {
              'text-color': ['case', ['<', ['get', 'mag'], 3], 'black', 'white'],
            },
          });

          // objects for caching and keeping track of HTML marker objects (for performance)
          const markers: any = {};
          let markersOnScreen: any = {};

          function updateMarkers() {
            const newMarkers: any = {};
            const features: any = map.querySourceFeatures('earthquakes');

            // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
            // and add it to the map if it's not there already
            for (const feature of features) {
              const coords = feature.geometry.coordinates;
              const properties = feature.properties;
              if (!properties.cluster) continue;
              const id = properties.cluster_id;

              let marker: any = markers[id];
              if (!marker) {
                const el: any = createDonutChart(properties);
                marker = markers[id] = new mapboxgl.Marker({
                  element: el,
                }).setLngLat(coords);
              }
              newMarkers[id] = marker;

              if (!markersOnScreen[id]) marker.addTo(map);
            }
            // for every marker we've added previously, remove those that are no longer visible
            for (const id in markersOnScreen) {
              if (!newMarkers[id]) markersOnScreen[id].remove();
            }
            markersOnScreen = newMarkers;
          }

          // after the GeoJSON data is loaded, update markers on the screen on every frame
          map.on('render', () => {
            if (!map.isSourceLoaded('earthquakes')) return;
            updateMarkers();
          });
        });
      }
    }, 1000);
  }, []);

  return (
    <div className="stastics-and-pie-card height-map-rem">
      <div className="pie-charts-title">Transfer Locations International</div>
      {loading ? (
        <div className="margin-top-2">
          <Skeleton active />
          <Skeleton active />
        </div>
      ) : (
        <>
          <div className="map-content">
            <div className="map-container" ref={mapContainerInternationalRef} />
          </div>
          <div className="updated-on">
            <div className="updated-moment-container">{moment(lastUpdate * 1000).fromNow()}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default TransferLocationsMap;
