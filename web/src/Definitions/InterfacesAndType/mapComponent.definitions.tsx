export enum MapTypes {
  Mapbox,
}

export interface MarkerData {
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
  mapType: number;
  center: number[];
  markers?: MarkerData[];
  zoom: number;
  mapSource?: MapSourceData;
  onClick?: any;
  showPopupOnClick?: boolean;
  clickedPopupData?: MapPopupData;
  onMouseMove?: any;
  layer?: any;
  height: number;
  style: string;
}
