import { useEffect, useState } from 'react';
import { Col, DatePicker, Row, Skeleton, message } from 'antd';
import './dashboard.scss';
import { getChartOptions } from './CHART_OPTIONS';
import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import PieChartsStat from './pieChartStat';
import { CompanyRole } from '../../../Casl/enums/company.role.enum';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useTranslation } from 'react-i18next';
import { WidgetType } from '../../../Casl/enums/widget.type.enum';
import { MrvStatsCardsTypes } from '../../../Casl/enums/statsCards.type.enum';
import ListWidget from './listWidget';
import { Clipboard2Pulse, HandThumbsUp } from 'react-bootstrap-icons';
import { MapSourceData, MapTypes, MarkerData } from '@undp/carbon-library';
import MapStats from './mapStats';

const { RangePicker } = DatePicker;

const MRVDashboard = () => {
  const { t } = useTranslation(['dashboard']);
  const { get, post, delete: del } = useConnection();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { userInfoState } = useUserContext();
  const [endTime, setEndTime] = useState<number>(Date.parse(String(moment().endOf('day'))));
  const [startTime, setStartTime] = useState<number>(
    Date.parse(String(moment().subtract('13', 'days').startOf('day')))
  );
  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : 'None';
  const colors = [
    '#C6A7FE',
    '#7FEABF',
    '#CDCDCD',
    '#FF8183',
    '#B7A4FE',
    '#16B1FF',
    '#FFB480',
    '#666699',
    '#009999',
    '#c2c2d6',
    '#ddddbb',
    '#ff9900',
  ];

  const colorsStatus = ['#C6A7FE', '#FF8183', '#CDCDCD', '#7FEABF', '#B7A4FE'];

  const TTSuffix = userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ? 'My' : '';
  const genPayload = () => {
    const stats = [];
    for (const item in MrvStatsCardsTypes) {
      stats.push({
        type: item,
        statFilter: {
          startTime: startTime !== 0 ? startTime : undefined,
          endTime: endTime !== 0 ? endTime : undefined,
          onlyMine: userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER,
        },
      });
    }
    return {
      stats: stats,
    };
  };

  const ndActionDataParse = (statData: any, labelField: string, valueField: string) => {
    const parsed = [0, 0, 0, 0];
    for (const d of statData.data) {
      if (d.action === 'mitigation') {
        parsed[0] = parseFloat(d.count);
      } else if (d.action === 'adaptation') {
        parsed[1] = parseFloat(d.count);
      } else if (d.action === 'enablement') {
        parsed[3] = parseFloat(d.count);
      } else if (d.action === 'crosscutting') {
        parsed[2] = parseFloat(d.count);
      }
    }
    return [parsed, ['Mitigation', 'Adaptation', 'Crosscutting', 'Enablement']];
  };

  const dataParser = (statData: any, labelField: string, valueField: string) => {
    const parsed: any[] = [];
    const label: any[] = [];
    for (const d of statData.data) {
      parsed.push(parseFloat(d[valueField]));
      label.push(d[labelField]);
    }

    console.log('Data', parsed, label);
    return [parsed, label];
  };

  const emissionParser = (statData: any, labelField: string, valueField: string) => {
    const parsed: any[] = [];
    if (!statData.data || statData.data.length <= 0) {
      return [t('emissionExpected'), 0, []];
    }

    const d = statData.data[0];
    parsed.push({
      value: parseFloat(d.totemissionreductionachieved),
      label: t('emissionEAchieved'),
      icon: (
        <HandThumbsUp
          style={{
            color: '#5DC380',
            fontSize: '25px',
          }}
        />
      ),
      startColor: '#EDF8F0',
      endColor: '#5DC380',
    });

    console.log('Data', parsed);
    return [t('emissionExpected'), parseFloat(d.totemissionreductionexpected), parsed];
  };

  const countS = ['all', ['>=', ['get', 'count'], 0]];

  const mapDataParse = (statData: any, labelField: string, valueField: string) => {
    const pending = ['all', ['==', ['get', 'stage'], 'AwaitingAuthorization']];
    const authorised = ['all', ['==', ['get', 'stage'], 'Authorised']];
    const rejected = ['all', ['==', ['get', 'stage'], 'Rejected']];
    const approved = ['all', ['==', ['get', 'stage'], 'Approved']];

    const center = statData?.features[0]?.geometry?.coordinates
      ? statData?.features[0]?.geometry?.coordinates
      : [7.4924165, 5.5324032];

    const mapSource: MapSourceData = {
      key: 'programmeLocations',
      data: {
        type: 'geojson',
        data: statData,
        cluster: true,
        clusterRadius: 40,
        clusterProperties: {
          // keep separate counts for each programmeStage category in a cluster
          count: ['+', ['case', countS, ['get', 'count'], 0]],
          pending: ['+', ['case', pending, ['get', 'count'], 0]],
          authorised: ['+', ['case', authorised, ['get', 'count'], 0]],
          rejected: ['+', ['case', rejected, ['get', 'count'], 0]],
          approved: ['+', ['case', approved, ['get', 'count'], 0]],
        },
      },
    };

    const layer = {
      id: 'programmes_circle',
      type: 'circle',
      source: 'programmeLocations',
      filter: ['!=', 'cluster', true],
      paint: {
        'circle-color': [
          'case',
          pending,
          colorsStatus[0],
          authorised,
          colorsStatus[1],
          colorsStatus[2],
        ],
        'circle-opacity': 1,
        'circle-radius': 10,
      },
    };
    return [mapSource, layer, center, ['Authorised', 'Rejected', 'Pending', 'Approved']];
  };

  const mapDataParseInvestment = (statData: any, labelField: string, valueField: string) => {
    const publictype = ['all', ['==', ['get', 'type'], 'Public']];
    const privatetype = ['all', ['==', ['get', 'type'], 'Private']];
    const unknownType = ['all', ['==', ['get', 'type'], 'Unknown']];

    const center = statData?.features[0]?.geometry?.coordinates
      ? statData?.features[0]?.geometry?.coordinates
      : [7.4924165, 5.5324032];

    const mapSource: MapSourceData = {
      key: 'investmentLocations',
      data: {
        type: 'geojson',
        data: statData,
        cluster: true,
        clusterRadius: 40,
        clusterProperties: {
          // keep separate counts for each programmeStage category in a cluster
          count: ['+', ['case', countS, ['get', 'count'], 0]],
          public: ['+', ['case', publictype, ['get', 'count'], 0]],
          private: ['+', ['case', privatetype, ['get', 'count'], 0]],
          unknown: ['+', ['case', unknownType, ['get', 'count'], 0]],
        },
      },
    };

    const layer = {
      id: 'programmes_circle',
      type: 'circle',
      source: 'investmentLocations',
      filter: ['!=', 'cluster', true],
      paint: {
        'circle-color': [
          'case',
          publictype,
          colorsStatus[0],
          privatetype,
          colorsStatus[2],
          colorsStatus[1],
        ],
        'circle-opacity': 1,
        'circle-radius': 10,
      },
    };
    return [mapSource, layer, center, ['Public', 'Private', 'Unknown']];
  };

  const donutSegment = (start: any, end: any, r: any, r0: any, color: any) => {
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
  };

  // code for creating an SVG donut chart from feature properties
  const createDonutChart = (properties: any) => {
    console.log('properties of donut creator --- > ', properties);
    const offsets = [];
    const offsetsStage = [];
    let counts: any = [];
    let programmeStageCounts: any = [];
    if (properties.count) {
      counts = [properties.count];
    }

    if (properties.cluster_id) {
      programmeStageCounts = [
        properties.authorised,
        properties.rejected,
        properties.pending,
        properties.approved,
      ];
    } else {
      if (properties?.stage === 'AwaitingAuthorization') {
        programmeStageCounts = [0, 0, properties.count, 0];
      } else if (properties?.stage === 'Authorised') {
        programmeStageCounts = [properties.count, 0, 0, 0];
      } else if (properties?.stage === 'Rejected') {
        programmeStageCounts = [0, properties.count, 0, 0];
      } else if (properties?.stage === 'Approved') {
        programmeStageCounts = [0, 0, 0, properties.count];
      }
    }
    let total = 0;
    for (const count of counts) {
      offsets.push(total);
      total += count;
    }
    let totalStage = 0;
    for (const count of programmeStageCounts) {
      offsetsStage.push(totalStage);
      totalStage += count;
    }
    const fontSize = total >= 1000 ? 22 : total >= 500 ? 20 : total >= 100 ? 18 : 16;
    const r = total >= 1000 ? 52 : total >= 500 ? 36 : total >= 100 ? 30 : 18;
    const r0 = Math.round(r * 0.6);
    const w = r * 2;

    let html = `<div>
      <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

    for (let i = 0; i < programmeStageCounts?.length; i++) {
      if (programmeStageCounts[i] !== 0) {
        html += donutSegment(
          offsetsStage[i] === 0 ? 0 : offsetsStage[i] / totalStage,
          (offsetsStage[i] + programmeStageCounts[i]) / totalStage,
          r,
          r0,
          colorsStatus[i]
        );
      }
    }
    html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
      <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${total}
      </text>
      </svg>
      </div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild;
  };

  const createDonutChartInvestment = (properties: any) => {
    console.log('properties of donut creator --- > ', properties);
    const offsets = [];
    const offsetsStage = [];
    let counts: any = [];
    let typeCounts: any = [];
    if (properties.count) {
      counts = [properties.count];
    }

    if (properties.cluster_id) {
      typeCounts = [properties.public, properties.private, properties.unknown];
    } else {
      if (properties?.type === 'Public') {
        typeCounts = [properties.count, 0, 0];
      } else if (properties?.type === 'Private') {
        typeCounts = [0, properties.count, 0];
      } else if (properties?.type === 'Unknown') {
        typeCounts = [0, 0, properties.count];
      }
    }
    let total = 0;
    for (const count of counts) {
      offsets.push(total);
      total += count;
    }
    let totalStage = 0;
    for (const count of typeCounts) {
      offsetsStage.push(totalStage);
      totalStage += count;
    }
    const fontSize = total >= 1000 ? 22 : total >= 500 ? 20 : total >= 100 ? 18 : 16;
    const r = total >= 1000 ? 52 : total >= 500 ? 36 : total >= 100 ? 30 : 18;
    const r0 = Math.round(r * 0.6);
    const w = r * 2;

    let html = `<div>
      <svg width="${w}" height="${w}" viewbox="0 0 ${w} ${w}" text-anchor="middle" style="font: ${fontSize}px sans-serif; display: block">`;

    for (let i = 0; i < typeCounts?.length; i++) {
      if (typeCounts[i] !== 0) {
        html += donutSegment(
          offsetsStage[i] === 0 ? 0 : offsetsStage[i] / totalStage,
          (offsetsStage[i] + typeCounts[i]) / totalStage,
          r,
          r0,
          colorsStatus[i]
        );
      }
    }
    html += `<circle cx="${r}" cy="${r}" r="${r0}" fill="white" />
      <text dominant-baseline="central" transform="translate(${r}, ${r})">
      ${total}
      </text>
      </svg>
      </div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild;
  };

  const supportedWidgetList: any = {
    AGG_NDC_ACTION_BY_TYPE: {
      widgetType: WidgetType.PIE,
      aggType: MrvStatsCardsTypes.AGG_NDC_ACTION_BY_TYPE,
      configs: {
        title: t('ndcType'),
        tooltip: t('ndcTypeTT' + TTSuffix),
        colors: colors,
      },
      callbacks: {
        parseData: ndActionDataParse,
      },
    },
    TOTAL_EMISSIONS: {
      widgetType: WidgetType.LIST,
      aggType: MrvStatsCardsTypes.TOTAL_EMISSIONS,
      configs: {
        title: t('titleEmission'),
        tooltip: t('titleEmissionTT' + TTSuffix),
        subTitle: '(tCO2e)',
        icon: <Clipboard2Pulse color={'#5DC380'} size={80} />,
      },
      callbacks: {
        parseData: emissionParser,
      },
    },
    AGG_NDC_ACTION_BY_SECTOR: {
      widgetType: WidgetType.PIE,
      aggType: MrvStatsCardsTypes.AGG_NDC_ACTION_BY_SECTOR,
      configs: {
        title: t('ndcSector'),
        tooltip: t('ndcSectorTT' + TTSuffix),
        colors: colors,
        dataLabelField: 'sector',
        dataValField: 'count',
      },
      callbacks: {
        parseData: dataParser,
      },
    },
    AGG_INVESTMENT_BY_TYPE: {
      widgetType: WidgetType.PIE,
      aggType: MrvStatsCardsTypes.AGG_INVESTMENT_BY_TYPE,
      configs: {
        title: t('totalInvestment'),
        subTitle: '($)',
        tooltip: t('totalInvestmentTT' + TTSuffix),
        colors: colors,
        dataLabelField: 'type',
        dataValField: 'amount',
      },
      callbacks: {
        parseData: dataParser,
      },
    },
    AGG_PROGRAMME_BY_SECTOR: {
      widgetType: WidgetType.PIE,
      aggType: MrvStatsCardsTypes.AGG_PROGRAMME_BY_SECTOR,
      configs: {
        title: t('creditsSector'),
        subTitle: '(ITMOs)',
        tooltip: t('creditsSectorTT' + TTSuffix),
        colors: colors,
        dataLabelField: 'sector',
        dataValField: 'totalestcredit',
      },
      callbacks: {
        parseData: dataParser,
      },
    },
    PROGRAMME_LOCATION: {
      widgetType: WidgetType.MAP,
      aggType: MrvStatsCardsTypes.PROGRAMME_LOCATION,
      configs: {
        title: t('programmeLocation'),
        tooltip: t('programmeLocationTT' + TTSuffix),
        colors: colorsStatus,
        dataLabelField: 'sector',
        dataValField: 'totalestcredit',
        style: 'mapbox://styles/mapbox/light-v11',
        renderCB: (map: any) => {
          if (!map.isSourceLoaded('programmeLocations')) return;

          const currentMarkers: MarkerData[] = [];
          const features: any = map.querySourceFeatures('programmeLocations');

          // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
          // and add it to the map if it's not there already
          for (const feature of features) {
            const coords = feature.geometry.coordinates;
            const properties = feature.properties;
            const id = properties.cluster_id ? properties.cluster_id : Number(properties.id);

            const el: any = createDonutChart(properties);
            const marker = {
              id: id,
              element: el,
              location: coords,
            };

            currentMarkers.push(marker);
          }

          return currentMarkers;
        },
        mapType: mapType,
      },
      callbacks: {
        parseData: mapDataParse,
      },
    },
    INVESTMENT_LOCATION: {
      widgetType: WidgetType.MAP,
      aggType: MrvStatsCardsTypes.INVESTMENT_LOCATION,
      configs: {
        title: t('investLocations'),
        tooltip: t('investLocationsTT' + TTSuffix),
        colors: colorsStatus,
        dataLabelField: 'sector',
        dataValField: 'totalestcredit',
        style: 'mapbox://styles/mapbox/light-v11',
        renderCB: (map: any) => {
          if (!map.isSourceLoaded('investmentLocations')) return;

          const currentMarkers: MarkerData[] = [];
          const features: any = map.querySourceFeatures('investmentLocations');

          // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
          // and add it to the map if it's not there already
          for (const feature of features) {
            const coords = feature.geometry.coordinates;
            const properties = feature.properties;
            const id = properties.cluster_id ? properties.cluster_id : Number(properties.id);

            const el: any = createDonutChartInvestment(properties);
            const marker = {
              id: id,
              element: el,
              location: coords,
            };

            currentMarkers.push(marker);
          }

          return currentMarkers;
        },
        mapType: mapType,
      },
      callbacks: {
        parseData: mapDataParseInvestment,
      },
    },
  };

  const layout = [
    [MrvStatsCardsTypes.AGG_NDC_ACTION_BY_TYPE, MrvStatsCardsTypes.TOTAL_EMISSIONS],
    [
      MrvStatsCardsTypes.AGG_NDC_ACTION_BY_SECTOR,
      MrvStatsCardsTypes.AGG_PROGRAMME_BY_SECTOR,
      MrvStatsCardsTypes.AGG_INVESTMENT_BY_TYPE,
    ],
    [MrvStatsCardsTypes.PROGRAMME_LOCATION, MrvStatsCardsTypes.INVESTMENT_LOCATION],
  ];

  const getData = async () => {
    setLoading(true);
    try {
      const response: any = await post(
        'stats/programme/agg',
        genPayload(),
        undefined,
        process.env.REACT_APP_STAT_URL
      );
      console.log('Response', response);
      const newd: any = {};
      for (const key in response?.data?.stats) {
        if (response?.data?.stats.hasOwnProperty(key)) {
          const obj = response?.data?.stats[key];
          const config = supportedWidgetList[key];
          if (config) {
            const dx = config.callbacks.parseData(
              obj,
              config.configs.dataLabelField,
              config.configs.dataValField
            );
            newd[key] = {
              data: dx,
              time:
                !obj.last || obj.last === '0' || obj.last === 0
                  ? '0'
                  : moment(parseInt(obj.last)).fromNow(),
            };
          }
        }
      }

      setData(newd);
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const getWidgetJSX = (objname: any) => {
    const obj = supportedWidgetList[objname];
    if (!obj) {
      return <></>;
    }

    const d = data[obj.aggType];
    if (!d) {
      return <></>;
    }
    if (obj.widgetType === WidgetType.PIE) {
      return (
        <Col xxl={8} xl={8} md={12} className="stastic-card-col pie">
          <PieChartsStat
            id={obj.aggType}
            title={obj.configs.title}
            subTitle={obj.configs.subTitle}
            options={getChartOptions(d.data[1], obj.configs.colors)}
            series={d.data[0]}
            lastUpdate={d.time}
            loading={loading}
            toolTipText={obj.configs.tooltip}
          />
        </Col>
      );
    }
    if (obj.widgetType === WidgetType.LIST) {
      return (
        <Col xxl={8} xl={8} md={8} className="stastic-card-col">
          <ListWidget
            data={d.data[2]}
            icon={obj.configs.icon}
            total={d.data[1]}
            totalText={d.data[0]}
            updatedDate={d.time}
            loading={loading}
            toolTipText={obj.configs.tooltip}
            title={obj.configs.title}
            subTitle={obj.configs.subTitle}
          />
        </Col>
      );
    } else if (obj.widgetType === WidgetType.MAP && mapType !== MapTypes.None) {
      return (
        <Col xxl={12} xl={12} md={12} className="stastic-card-col">
          <MapStats
            id={obj.aggType}
            title={obj.configs.title}
            lastUpdate={d.time}
            loading={loading}
            toolTipText={obj.configs.tooltip}
            mapType={obj.configs.mapType}
            mapCenter={d.data[2]}
            mapZoom={4}
            dataSource={d.data[0]}
            mapLayer={d.data[1]}
            renderCB={obj.configs.renderCB}
            style={obj.configs.style}
            labels={d.data[3]}
            colors={obj.configs.colors}
          />
        </Col>
      );
    } else {
      return <div></div>;
    }
  };

  const onChangeRange = async (dateMoment: any, dateString: any) => {
    try {
      if (!dateMoment) {
        setStartTime(0);
        setEndTime(0);
      }
      if (dateMoment !== null && dateMoment[1] !== null) {
        setStartTime(Date.parse(String(moment(dateMoment[0]?._d).startOf('day'))));
        setEndTime(Date.parse(String(moment(dateMoment[1]?._d).endOf('day'))));
      } else {
        setStartTime(0);
        setEndTime(0);
      }
    } catch (e: any) {
      setStartTime(0);
      setEndTime(0);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    getData();
  }, [startTime, endTime]);

  return (
    <div className="dashboard-main-container">
      <div className="filter-container">
        <div className="date-filter">
          <RangePicker
            ranges={{
              Today: [moment(), moment()],
              'Last 7 days': [moment().subtract('6', 'days'), moment()],
              'Last 14 days': [moment().subtract('13', 'days'), moment()],
            }}
            defaultValue={[moment().subtract('13', 'days'), moment()]}
            showTime
            allowClear={true}
            format="DD:MM:YYYY"
            onChange={onChangeRange}
          />
        </div>
      </div>

      {loading ? (
        <div className="stastics-and-charts-container center">
          <Skeleton />
        </div>
      ) : (
        layout.map((row, i) => (
          <div className="stastics-and-charts-container center">
            <Row gutter={[40, 40]} className="stastic-card-row">
              {row.map((item, j) => getWidgetJSX(item))}
            </Row>
          </div>
        ))
      )}
    </div>
  );
};

export default MRVDashboard;
