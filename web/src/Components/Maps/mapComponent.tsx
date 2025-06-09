import {
  MapComponentProps,
  MapTypes,
} from '../../Definitions/Definitions/mapComponent.definitions';
import { MapboxComponent } from './mapboxComponent';
import React from 'react';

export const MapComponent = (props: MapComponentProps) => {
  const { mapType } = props;

  return <div>{mapType === MapTypes.Mapbox ? MapboxComponent(props) : ''}</div>;
};
