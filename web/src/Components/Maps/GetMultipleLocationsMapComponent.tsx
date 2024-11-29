// This component capture conditionally multiple polygons and set them to specified field in ant d form instance
import { FormInstance } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { MapSourceData } from '../../Definitions/Definitions/mapComponent.definitions';
import { MapComponent } from './mapComponent';
import './mapboxComponent.scss';
import { DeleteOutlined } from '@ant-design/icons';
import { deepCopy } from '../../Utils/deepCopy';

interface IMultipleLocationsMapComponetProps {
  form: FormInstance;
  formItemName: [number, string] | string;
  listName?: any;
  existingCoordinate?: any[];
  disabled?: boolean;
  center?: [number, number];
  disableMultipleLocations?: boolean;
}

const GetMultipleLocationsMapComponent = (props: IMultipleLocationsMapComponetProps) => {
  const {
    form,
    listName,
    formItemName,
    existingCoordinate,
    disabled,
    center,
    disableMultipleLocations,
  } = props;

  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : 'None';
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const [projectLocations, setProjectLocations] = useState<any[][]>(existingCoordinate || []);

  const [projectLocationMapSource, setProjectLocationMapSource] = useState<any>();
  const [projectLocationMapLayer, setProjectLocationMapLayer] = useState<any>();
  const [projectLocationMapOutlineLayer, setProjectLocationMapOutlineLayer] = useState<any>();
  const [projectLocationMapCenter, setProjectLocationMapCenter] = useState<number[]>([]);

  const [zoomLevel, setZoomLevel] = useState(5);

  const updateZoomLevel = (zoom: number) => {
    setZoomLevel(zoom);
  };

  const updateCenter = (newCenter: [number, number]) => {
    setProjectLocationMapCenter(newCenter);
  };

  useEffect(() => {
    if (!disabled) {
      setProjectLocations([]);
      updateZoomLevel(4);
    }
  }, [disableMultipleLocations]);

  useEffect(() => {
    if (existingCoordinate) {
      setProjectLocations(existingCoordinate);
    }
  }, [existingCoordinate]);

  useEffect(() => {
    setProjectLocationMapCenter(center ? center : [80.7718, 7.8731]);

    const tempMapSource: any = [];
    const tempLocationLayer: any = [];
    const tempOutlineLayer: any = [];

    projectLocations?.forEach((location: any, index: number) => {
      const mapSource: MapSourceData = {
        key: `projectLocation-${index}`,
        data: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: location,
            },
            properties: null,
          },
        },
      };

      tempMapSource.push(mapSource);
      tempLocationLayer.push({
        id: `projectLocationLayer-${index}`,
        type: 'fill',
        source: `projectLocation-${index}`,
        layout: {},
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5,
        },
      });
      tempOutlineLayer.push({
        id: `projectLocationOutline-${index}`,
        type: 'line',
        source: `projectLocation-${index}`,
        layout: {},
        paint: {
          'line-color': '#000',
          'line-width': 1,
        },
      });
    });

    setProjectLocationMapSource(tempMapSource);
    setProjectLocationMapLayer(tempLocationLayer);
    setProjectLocationMapOutlineLayer(tempOutlineLayer);

    if (listName && projectLocations !== undefined) {
      const listFields = form.getFieldValue(listName);

      if (listFields[formItemName[0]] !== undefined) {
        listFields[formItemName[0]][formItemName[1]] = projectLocations;
      } else {
        listFields[formItemName[0]] = {
          [formItemName[1]]: projectLocationMapCenter,
        };
      }

      form.setFieldValue(listName, listFields);
    } else if (projectLocations !== undefined) {
      form.setFieldValue(formItemName, projectLocations);
    }

    // const lastLocationCoordinates = projectLocations.pop()?.pop();
    const tempProjectLocations = deepCopy(projectLocations);

    if (tempProjectLocations.length > 0) {
      const lastPointCoordinates = tempProjectLocations.pop()?.pop().pop();
      updateCenter(lastPointCoordinates);
    }
  }, [projectLocations]);

  const onPolygonComplete = function (data: any) {
    if (data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates[0];

      if (disableMultipleLocations) {
        setProjectLocations([[coordinates]]);
      } else {
        setProjectLocations((prev) => {
          if (prev) {
            return [...prev, [coordinates]];
          } else {
            return [[coordinates]];
          }
        });
      }
    }
  };

  const deleteLocation = (index: number) => {
    setProjectLocations((prev) => {
      const tempPrev = prev.filter((item: any, itemIndex: number) => itemIndex !== index);
      return tempPrev;
    });
  };

  const mapComponentMemoizedValue = useMemo(() => {
    return (
      <MapComponent
        mapType={mapType}
        center={projectLocationMapCenter}
        zoom={zoomLevel}
        updateZoomLevel={updateZoomLevel}
        updateCenter={updateCenter}
        height={250}
        style="mapbox://styles/mapbox/light-v11"
        accessToken={accessToken}
        onPolygonComplete={!disabled ? onPolygonComplete : undefined}
        mapSource={projectLocationMapSource}
        layer={projectLocationMapLayer}
        outlineLayer={projectLocationMapOutlineLayer}
      ></MapComponent>
    );
  }, [
    projectLocationMapCenter,
    projectLocationMapSource,
    projectLocationMapLayer,
    projectLocationMapOutlineLayer,
    disableMultipleLocations,
  ]);

  const genProjectLocationsView = () => {
    if (projectLocations.length > 0) {
      return (
        <div className="multiple-location-info-container">
          {projectLocations?.map((location: number[][][], i: number) => (
            <div className="multiple-location-details" key={i}>
              Location {i + 1}:{' '}
              <div className="coordinates">
                {'{ '}
                {location.map((coords: number[][], j: number) => {
                  return (
                    <>
                      {coords.map((singleCoord: number[], k: number) => (
                        <>
                          [<p key={i + j + k + 0}>{singleCoord[0]}</p>,
                          <p key={i + j + k + 1}>&nbsp;{singleCoord[1]}</p>]
                          {k !== coords.length - 1 ? <p>,&nbsp;</p> : <></>}
                        </>
                      ))}
                    </>
                  );
                })}
                {' }'}
              </div>
              {!disabled && (
                <DeleteOutlined
                  className="delete-icon"
                  onClick={() => deleteLocation(i)}
                  disabled={disabled}
                />
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      {genProjectLocationsView()}
      {mapComponentMemoizedValue}
    </>
  );
};

export default GetMultipleLocationsMapComponent;
