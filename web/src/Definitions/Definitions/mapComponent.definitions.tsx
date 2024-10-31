export enum MapTypes {
  Mapbox = 'Mapbox',
  None = 'None',
}

export interface MarkerData {
  id?: number;
  color?: string;
  location: number[];
  element?: any;
}

export interface MapSourceData {
  key: string;
  data: any;
}

export interface MapPopupData {
  html: string;
}

export interface MapComponentProps {
  mapType: string;
  center: number[];
  updateCenter?: (center: [number, number]) => void;
  markers?: MarkerData[];
  zoom: number;
  mapSource?: MapSourceData | MapSourceData[];
  onClick?: any;
  showPopupOnClick?: boolean;
  onMouseMove?: any;
  layer?: any;
  height: number;
  style: string;
  onRender?: any;
  accessToken?: any;
  onPolygonComplete?: any;
  outlineLayer?: any;
  updateZoomLevel?: (zoom: number) => void;
}
