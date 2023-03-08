import {
  MapComponentProps,
  MapTypes,
} from '../../Definitions/InterfacesAndType/mapComponent.definitions';
import MapboxComponent from './MapboxComponent';

const MapComponent = (props: MapComponentProps) => {
  const { mapType } = props;

  return <div>{mapType === MapTypes.Mapbox ? MapboxComponent(props) : ''}</div>;
};

export default MapComponent;
