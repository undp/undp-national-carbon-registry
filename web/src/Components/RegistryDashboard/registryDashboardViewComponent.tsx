import React, { useEffect, useState } from 'react';
import {
  Button,
  Col,
  DatePicker,
  Radio,
  Row,
  Skeleton,
  Tooltip,
  message,
  Dropdown,
  Space,
  MenuProps,
} from 'antd';
// import type { MenuProps } from 'antd';
import './dashboard.scss';
import { BookOutlined, DownloadOutlined, CaretDownOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
  ClockHistory,
  BoxArrowInRight,
  ShieldX,
  ShieldExclamation,
  BoxArrowRight,
  ShieldCheck,
  Gem,
  InfoCircle,
} from 'react-bootstrap-icons';
import {
  ChartSeriesItem,
  totalCertifiedCreditsSeriesInitialValues,
  totalCreditsSeriesInitialValues,
  getTotalProgrammesInitialValues,
  getTotalProgrammesSectorInitialValues,
} from './dashboardTypesInitialValues';
// import {
//   CompanyRole,
//   MapSourceData,
//   MapTypes,
//   MarkerData,
//   ProgrammeStageLegend,
//   ProgrammeStageR,
//   Sector,
//   SystemNames,
//   addCommSep,
//   addRoundNumber,
//   getStageEnumVal,
// } from '../../Definitions';
import {
  optionDonutPieA,
  optionDonutPieB,
  totalCreditsCertifiedOptions,
  totalCreditsOptions,
  totalProgrammesOptions,
  totalProgrammesOptionsSub,
} from './registryChartOptions';
// import { StasticCard } from '../Common/StasticCard/stasticCard';
import { ProgrammeRejectAndTransferComponent } from './programmeRejectAndTransferComponent';
import { RegistryPieChartsStatComponent } from './registryPieChartStatComponent';
// import { MapComponent } from '../Common/Maps/mapComponent';
// import { LegendItem } from '../Common/LegendItem/legendItem';
import { RegistryBarChartsStatComponent } from './registryBarChartStatsComponent';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { SystemNames } from '../../Definitions/Enums/statsCards.type.enum';
import {
  MapSourceData,
  MapTypes,
  MarkerData,
} from '../../Definitions/Definitions/mapComponent.definitions';
import {
  getStageEnumVal,
  addRoundNumber,
  addCommSep,
} from '../../Definitions/Definitions/programme.definitions';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { ProgrammeStageLegend, ProgrammeStageR } from '../../Definitions/Enums/programmeStage.enum';
import { Sector } from '../../Definitions/Enums/sector.enum';
import { LegendItem } from '../LegendItem/legendItem';
import { MapComponent } from '../Maps/mapComponent';
import { StasticCard } from '../StatisticsCard/statisticsCard';
const { RangePicker } = DatePicker;
// import { useConnection, useUserContext } from '../../Context';

export const RegistryDashboardComponent = (props: any) => {
  const { Chart, t, ButtonGroup, Link, isMultipleDashboardsVisible = false } = props;
  const { get, post, delete: del, statServerUrl } = useConnection();
  const { userInfoState } = useUserContext();
  const [loadingWithoutTimeRange, setLoadingWithoutTimeRange] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCharts, setLoadingCharts] = useState<boolean>(false);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [pendingProjectsWithoutTimeRange, setPendingProjectsWithoutTimeRange] = useState<number>(0);
  const [pendingProjects, setPendingProjects] = useState<number>(0);
  const [rejectedProjects, setRejectedProjects] = useState<number>(0);
  const [authorisedProjects, setAuthorisedProjects] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditBalanceWithoutTimeRange, setCreditBalanceWithoutTimeRange] = useState<number>(0);
  const [creditCertiedBalanceWithoutTimeRange, setCreditCertifiedBalanceWithoutTimeRange] =
    useState<number>(0);
  const [creditsPieSeries, setCreditPieSeries] = useState<number[]>([1, 1, 0, 0]);
  const [creditsCertifiedPieSeries, setCreditCertifiedPieSeries] = useState<number[]>([1, 1, 0]);
  const [creditsPieChartTotal, setCreditsPieChartTotal] = useState<any>(0);
  const [certifiedCreditsPieChartTotal, setCertifiedCreditsPieChartTotal] = useState<any>(0);

  const [startTime, setStartTime] = useState<number>(
    Date.parse(String(moment().subtract('13', 'days').startOf('day')))
  );
  const [endTime, setEndTime] = useState<number>(Date.parse(String(moment().endOf('day'))));
  const [categoryType, setCategoryType] = useState<string>('overall');

  // states for totalProgrammes chart
  const [totalProgrammesSeries, setTotalProgrammesSeries] = useState<ChartSeriesItem[]>(
    getTotalProgrammesInitialValues()
  );
  const [totalProgrammesOptionsLabels, setTotalProgrammesOptionsLabels] = useState<any[]>([]);

  // states for totalProgrammes sub sector chart
  const [totalProgrammesSectorSeries, setTotalProgrammesSectorSeries] = useState<ChartSeriesItem[]>(
    getTotalProgrammesSectorInitialValues()
  );
  const [totalProgrammesSectorOptionsLabels, setTotalProgrammesSectorOptionsLabels] = useState<
    any[]
  >([]);
  // states for totalCredits chart
  const [totalCreditsSeries, setTotalCreditsSeries] = useState<ChartSeriesItem[]>(
    totalCreditsSeriesInitialValues
  );
  const [totalCreditsOptionsLabels, setTotalCreditsOptionsLabels] = useState<any[]>([]);

  // states for totalCreditsCertified chart
  const [totalCertifiedCreditsSeries, setTotalCertifiedCreditsSeries] = useState<ChartSeriesItem[]>(
    totalCertifiedCreditsSeriesInitialValues
  );
  const [totalCertifiedCreditsOptionsLabels, setTotalCertifiedCreditsOptionsLabels] = useState<
    any[]
  >([]);

  // locations of programmes
  const [programmeLocations, setProgrammeLocations] = useState<any>();
  const [programmeTransferLocations, setProgrammeTransferLocations] = useState<any>();

  //certifier view states
  const [programmesCertifed, setProgrammesCertifed] = useState<number>(0);
  const [programmesUnCertifed, setProgrammesUnCertifed] = useState<number>(0);

  //programmeDeveloper
  const [transferRequestSent, setTransferRequestSent] = useState<number>(0);
  const [transferRequestReceived, setTransferRequestReceived] = useState<number>(0);

  //last time updates
  const [lastUpdateProgrammesStatsEpoch, setLastUpdateProgrammesStatsEpoch] = useState<number>(0);
  const [lastUpdateProgrammesStats, setLastUpdateProgrammesStats] = useState<string>('0');

  const [lastUpdatePendingTransferSentEpoch, setLastUpdatePendingTransferSentEpoch] =
    useState<number>(0);
  const [lastUpdatePendingTransferSent, setLastUpdatePendingTransferSent] = useState<string>('0');

  const [lastUpdateCreditBalanceEpoch, setLastUpdateCreditBalanceEpoch] = useState<number>(0);
  const [lastUpdateCreditBalance, setLastUpdateCreditBalance] = useState<string>('0');

  const [lastUpdatePendingTransferReceivedEpoch, setLastUpdatePendingTransferReceivedEpoch] =
    useState<number>(0);
  const [lastUpdatePendingTransferReceived, setLastUpdatePendingTransferReceived] =
    useState<string>('0');

  const [lastUpdateProgrammesCertifiableEpoch, setLastUpdateProgrammesCertifiableEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCertifiable, setLastUpdateProgrammesCertifiable] =
    useState<string>('0');

  const [lastUpdateCertifiedCreditsStatsEpoch, setLastUpdateCertifiedCreditsStatsEpoch] =
    useState<number>(0);
  const [lastUpdateCertifiedCreditsStats, setLastUpdateCertifiedCreditsStats] =
    useState<string>('0');

  const [lastUpdateProgrammesCertifiedEpoch, setLastUpdateProgrammesCertifiedEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCertified, setLastUpdateProgrammesCertified] = useState<string>('0');

  const [lastUpdateProgrammesStatsCEpoch, setLastUpdateProgrammesStatsCEpoch] = useState<number>(0);
  const [lastUpdateProgrammesStatsC, setLastUpdateProgrammesStatsC] = useState<string>('0');

  const [lastUpdateProgrammesCreditsStatsEpoch, setLastUpdateProgrammesCreditsStatsEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesCreditsStats, setLastUpdateProgrammesCreditsStats] =
    useState<string>('0');

  const [lastUpdateProgrammesSectorStatsCEpoch, setLastUpdateProgrammesSectorStatsCEpoch] =
    useState<number>(0);
  const [lastUpdateProgrammesSectorStatsC, setLastUpdateProgrammesSectorStatsC] =
    useState<string>('0');
  const [lastUpdateTotalCreditsEpoch, setLastUpdateTotalCreditsEpoch] = useState<number>(0);
  const [lastUpdateTotalCredits, setLastUpdateTotalCredits] = useState<string>('0');

  const [lastUpdateTotalCreditsCertifiedEpoch, setLastUpdateTotalCreditsCertifiedEpoch] =
    useState<number>(0);
  const [lastUpdateTotalCreditsCertified, setLastUpdateTotalCreditsCertified] =
    useState<string>('0');

  const [lastUpdateTransferLocationsEpoch, setLastUpdateTransferLocationsEpoch] =
    useState<number>(0);
  const [lastUpdateTransferLocations, setLastUpdateTransferLocations] = useState<string>('0');

  const [transferLocationsMapSource, setTransferLocationsMapSource] = useState<MapSourceData>();
  const [txLocationMapData, setTxLocationMapData] = useState<any>();
  const [transferLocationsMapLayer, setTransferLocationsMapLayer] = useState<any>();

  const [programmeLocationsMapCenter, setProgrammeLocationsMapCenter] = useState<number[]>([]);
  const [programmeLocationsMapSource, setProgrammeLocationsMapSource] = useState<MapSourceData>();
  const [programmeLocationsMapLayer, setProgrammeLocationsMapLayer] = useState<any>();

  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('-');
  const [selectedurl, setSelectedurl] = useState<string>('');
  const mapType = process.env.REACT_APP_MAP_TYPE ? process.env.REACT_APP_MAP_TYPE : 'None';
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const getAllProgrammeAnalyticsStatsParamsWithoutTimeRange = () => {
    return {
      system: SystemNames.CARBON_REGISTRY,
      stats: [
        {
          type: 'AGG_PROGRAMME_BY_STATUS',
        },
        {
          type: 'PENDING_TRANSFER_INIT',
        },
        {
          type: 'MY_CREDIT',
        },
        {
          type: 'PENDING_TRANSFER_RECV',
        },
        {
          type: 'UNCERTIFIED_BY_ME',
        },
        {
          type: 'CERTIFIED_BY_ME',
        },
      ],
    };
  };
  const getAllProgrammeAnalyticsStatsParams = () => {
    if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'MY_AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'MY_AGG_AUTH_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'MY_CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else if (userInfoState?.companyRole === 'Certifier' && categoryType === 'mine') {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'CERTIFIED_BY_ME_BY_STATE',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'AUTH_CERTIFIED_BY_ME_BY_STATE',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_BY_ME',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else if (userInfoState?.companyRole === 'Certifier' && categoryType === 'overall') {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'AGG_AUTH_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'AGG_AUTH_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    }
  };

  const getAllChartsParams = () => {
    if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'MY_AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'MY_AGG_PROGRAMME_BY_SECTOR',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'MY_CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'MY_TRANSFER_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'MY_PROGRAMME_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else if (userInfoState?.companyRole === 'Certifier' && categoryType === 'mine') {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'CERTIFIED_BY_ME_BY_STATE',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'CERTIFIED_BY_ME_BY_SECTOR',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_BY_ME',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'MY_TRANSFER_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'MY_PROGRAMME_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else if (userInfoState?.companyRole === 'Certifier' && categoryType === 'overall') {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'AGG_PROGRAMME_BY_SECTOR',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'ALL_TRANSFER_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'ALL_PROGRAMME_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
    } else {
      return {
        system: SystemNames.CARBON_REGISTRY,
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'AGG_PROGRAMME_BY_SECTOR',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'CERTIFIED_REVOKED_PROGRAMMES',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
              timeGroup: true,
            },
          },
          {
            type: 'ALL_TRANSFER_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
          {
            type: 'ALL_PROGRAMME_LOCATION',
            statFilter: {
              startTime: startTime !== 0 ? startTime : undefined,
              endTime: endTime !== 0 ? endTime : undefined,
            },
          },
        ],
      };
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

  const firstLower = (lower: any) => {
    return (lower && lower[0].toLowerCase() + lower.slice(1)) || lower;
  };

  const getAllProgrammesAggChartStats = async () => {
    setLoadingCharts(true);
    try {
      const response: any = await post(
        'stats/programme/agg',
        getAllChartsParams(),
        undefined,
        statServerUrl
      );
      let programmesAggByStatus: any;
      let programmesAggBySector: any;
      let totalCreditsCertifiedStats: any;
      let programmeLocationsStats: any;
      let transferLocationsStats: any;
      if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
        if (
          response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !== '0'
        ) {
          setLastUpdateTotalCreditsEpoch(
            parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateTotalCredits(
            moment(
              parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
            ).fromNow()
          );
        }
        programmesAggByStatus = response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.all?.createdTime &&
          String(response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.all?.createdTime) !== '0'
        ) {
          setLastUpdateProgrammesSectorStatsCEpoch(
            parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
          );
          setLastUpdateProgrammesSectorStatsC(
            moment(
              parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
            ).fromNow()
          );
        }
        programmesAggBySector = response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.data;
        if (
          response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateTotalCreditsCertifiedEpoch(
            parseInt(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateTotalCreditsCertified(
            moment(parseInt(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        totalCreditsCertifiedStats = response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
        if (
          response?.data?.stats?.MY_TRANSFER_LOCATION?.last &&
          String(response?.data?.stats?.MY_TRANSFER_LOCATION?.last) !== '0'
        ) {
          setLastUpdateTransferLocationsEpoch(
            parseInt(response?.data?.stats?.MY_TRANSFER_LOCATION?.last)
          );
          setLastUpdateTransferLocations(
            moment(parseInt(response?.data?.stats?.MY_TRANSFER_LOCATION?.last)).fromNow()
          );
        }
        transferLocationsStats = response?.data?.stats?.MY_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.MY_PROGRAMME_LOCATION;
      } else if (userInfoState?.companyRole === CompanyRole.CERTIFIER && categoryType === 'mine') {
        if (
          response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.last &&
          String(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.last) !== '0'
        ) {
          setLastUpdateTotalCreditsEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.last)
          );
          setLastUpdateTotalCredits(
            moment(parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.last)).fromNow()
          );
        } else {
          setLastUpdateTotalCredits('0');
          setLastUpdateTotalCreditsEpoch(0);
        }
        programmesAggByStatus = response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.data;
        if (
          response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.all?.certifiedTime &&
          String(response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.all?.certifiedTime) !== '0'
        ) {
          setLastUpdateProgrammesSectorStatsCEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.all?.certifiedTime)
          );
          setLastUpdateProgrammesSectorStatsC(
            moment(
              parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.all?.certifiedTime)
            ).fromNow()
          );
        } else {
          setLastUpdateProgrammesSectorStatsCEpoch(0);
          setLastUpdateProgrammesSectorStatsC('0');
        }
        programmesAggBySector = response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last) !== '0'
        ) {
          setLastUpdateTotalCreditsCertifiedEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last)
          );
          setLastUpdateTotalCreditsCertified(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last)).fromNow()
          );
        } else {
          setLastUpdateTotalCreditsCertifiedEpoch(0);
          setLastUpdateTotalCreditsCertified('0');
        }
        totalCreditsCertifiedStats = response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.data;
        if (
          response?.data?.stats?.MY_TRANSFER_LOCATION?.last &&
          String(response?.data?.stats?.MY_TRANSFER_LOCATION?.last) !== '0'
        ) {
          setLastUpdateTransferLocationsEpoch(
            parseInt(response?.data?.stats?.MY_TRANSFER_LOCATION?.last)
          );
          setLastUpdateTransferLocations(
            moment(parseInt(response?.data?.stats?.MY_TRANSFER_LOCATION?.last)).fromNow()
          );
        } else {
          setLastUpdateTransferLocationsEpoch(0);
          setLastUpdateTransferLocations('0');
        }
        transferLocationsStats = response?.data?.stats?.MY_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.MY_PROGRAMME_LOCATION;
      } else if (
        userInfoState?.companyRole === CompanyRole.CERTIFIER &&
        categoryType === 'overall'
      ) {
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !== '0'
        ) {
          setLastUpdateTotalCreditsEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateTotalCredits(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
            ).fromNow()
          );
        }
        programmesAggByStatus = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime) !== '0'
        ) {
          setLastUpdateProgrammesSectorStatsCEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
          );
          setLastUpdateProgrammesSectorStatsC(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
            ).fromNow()
          );
        }
        programmesAggBySector = response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateTotalCreditsCertifiedEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateTotalCreditsCertified(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        totalCreditsCertifiedStats = response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
        if (
          response?.data?.stats?.ALL_TRANSFER_LOCATION?.last &&
          String(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last) !== '0'
        ) {
          setLastUpdateTransferLocationsEpoch(
            parseInt(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last)
          );
          setLastUpdateTransferLocations(
            moment(parseInt(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last)).fromNow()
          );
        }
        transferLocationsStats = response?.data?.stats?.ALL_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.ALL_PROGRAMME_LOCATION;
      } else {
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !== '0'
        ) {
          setLastUpdateTotalCreditsEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateTotalCredits(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
            ).fromNow()
          );
        }
        programmesAggByStatus = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime) !== '0'
        ) {
          setLastUpdateProgrammesSectorStatsCEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
          );
          setLastUpdateProgrammesSectorStatsC(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.all?.createdTime)
            ).fromNow()
          );
        }
        programmesAggBySector = response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateTotalCreditsCertifiedEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateTotalCreditsCertified(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        totalCreditsCertifiedStats = response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
        if (
          response?.data?.stats?.ALL_TRANSFER_LOCATION?.last &&
          String(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last) !== '0'
        ) {
          setLastUpdateTransferLocationsEpoch(
            parseInt(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last)
          );
          setLastUpdateTransferLocations(
            moment(parseInt(response?.data?.stats?.ALL_TRANSFER_LOCATION?.last)).fromNow()
          );
        }
        transferLocationsStats = response?.data?.stats?.ALL_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.ALL_PROGRAMME_LOCATION;
      }
      let timeLabelDataStatus = [];
      let formattedTimeLabelDataStatus: any = [];
      let timeLabelDataSector = [];
      let formattedTimeLabelDataSector: any = [];
      let timeLabelCertifiedCreditsStats = [];
      let formattedTimeLabelCertifiedCreditsStats: any = [];
      if (programmesAggByStatus) {
        timeLabelDataStatus = programmesAggByStatus?.timeLabel;
        formattedTimeLabelDataStatus = timeLabelDataStatus?.map((item: any) => {
          return moment(new Date(item.substr(0, 16))).format('DD-MM-YYYY');
        });
        setTotalProgrammesOptionsLabels(formattedTimeLabelDataStatus);
        setTotalCreditsOptionsLabels(formattedTimeLabelDataStatus);
        const statusArray = Object.values(ProgrammeStageLegend);
        const totalProgrammesValues: ChartSeriesItem[] = [];
        statusArray?.map((status: any) => {
          totalProgrammesValues.push({
            name: status === 'AwaitingAuthorization' ? 'Pending' : status,
            data: programmesAggByStatus[firstLower(status)],
          });
        });
        setTotalProgrammesSeries(totalProgrammesValues);
        totalProgrammesOptions.xaxis.categories = formattedTimeLabelDataStatus;

        const totalCreditsValues: ChartSeriesItem[] = [
          {
            name: 'Authorised',
            data: programmesAggByStatus?.authorisedCredits,
          },
          {
            name: 'Issued',
            data: programmesAggByStatus?.issuedCredits,
          },
          {
            name: 'Transferred',
            data: programmesAggByStatus?.transferredCredits,
          },
          {
            name: 'Retired',
            data: programmesAggByStatus?.retiredCredits,
          },
          {
            name: 'Frozen',
            data: programmesAggByStatus?.frozenCredits,
          },
        ];
        setTotalCreditsSeries(totalCreditsValues);
        totalCreditsOptions.xaxis.categories = formattedTimeLabelDataStatus;
      }
      if (programmesAggBySector) {
        timeLabelDataSector = programmesAggByStatus?.timeLabel;
        formattedTimeLabelDataSector = timeLabelDataSector?.map((item: any) => {
          return moment(new Date(item.substr(0, 16))).format('DD-MM-YYYY');
        });
        setTotalProgrammesSectorOptionsLabels(formattedTimeLabelDataSector);
        const progarmmesSectorSeriesData: ChartSeriesItem[] = [];
        const sectorsArray = Object.values(Sector);
        sectorsArray?.map((sector: any) => {
          if (programmesAggBySector[firstLower(sector)] !== undefined) {
            progarmmesSectorSeriesData.push({
              name: sector,
              data: programmesAggBySector[firstLower(sector)],
            });
          }
        });
        setTotalProgrammesSectorSeries(progarmmesSectorSeriesData);
        totalProgrammesOptionsSub.xaxis.categories = formattedTimeLabelDataSector;
      }
      if (totalCreditsCertifiedStats) {
        timeLabelCertifiedCreditsStats = totalCreditsCertifiedStats?.timeLabel;
        formattedTimeLabelCertifiedCreditsStats = timeLabelCertifiedCreditsStats?.map(
          (item: any) => {
            return moment(new Date(item.substr(0, 16))).format('DD-MM-YYYY');
          }
        );
        const totalCertifiedCreditsSeriesValues = [
          {
            name: 'Certified',
            data: totalCreditsCertifiedStats?.certifiedSum,
          },
          {
            name: 'Uncertified',
            data: totalCreditsCertifiedStats?.uncertifiedSum,
          },
          {
            name: 'Revoked',
            data: totalCreditsCertifiedStats?.revokedSum,
          },
        ];
        setTotalCertifiedCreditsSeries(totalCertifiedCreditsSeriesValues);
        setTotalCertifiedCreditsOptionsLabels(formattedTimeLabelCertifiedCreditsStats);

        totalCreditsCertifiedOptions.xaxis.categories = formattedTimeLabelCertifiedCreditsStats;
      }
      if (transferLocationsStats) {
        setProgrammeTransferLocations(transferLocationsStats);
      }
      if (programmeLocationsStats) {
        setProgrammeLocations(programmeLocationsStats);
      }
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingCharts(false);
    }
  };

  const getAllProgrammeAnalyticsStatsWithoutTimeRange = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'stats/programme/agg',
        getAllProgrammeAnalyticsStatsParamsWithoutTimeRange(),
        undefined,
        statServerUrl
      );
      const programmeByStatusAggregationResponse =
        response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
      const pendingTransferInitAggregationResponse =
        response?.data?.stats?.PENDING_TRANSFER_INIT?.data;
      const pendingTransferReceivedAggregationResponse =
        response?.data?.stats?.PENDING_TRANSFER_RECV?.data;
      const myCreditAggregationResponse = response?.data?.stats?.MY_CREDIT?.data;
      const certifiedByMeAggregationResponse = response?.data?.stats?.CERTIFIED_BY_ME?.data[0];
      const unCertifiedByMeAggregationResponse = response?.data?.stats?.UNCERTIFIED_BY_ME?.data;
      programmeByStatusAggregationResponse?.map((responseItem: any, index: any) => {
        if (responseItem?.currentStage === 'AwaitingAuthorization') {
          setPendingProjectsWithoutTimeRange(parseInt(responseItem?.count));
        }
      });
      if (pendingTransferInitAggregationResponse) {
        setTransferRequestSent(parseInt(pendingTransferInitAggregationResponse[0]?.count));
      }
      if (myCreditAggregationResponse) {
        setCreditBalanceWithoutTimeRange(myCreditAggregationResponse?.primary);
      }
      if (pendingTransferReceivedAggregationResponse) {
        setTransferRequestReceived(parseInt(pendingTransferReceivedAggregationResponse[0]?.count));
      }
      if (certifiedByMeAggregationResponse) {
        setProgrammesCertifed(parseInt(certifiedByMeAggregationResponse?.count));
        setCreditCertifiedBalanceWithoutTimeRange(
          certifiedByMeAggregationResponse?.certifiedSum === null
            ? 0
            : parseFloat(certifiedByMeAggregationResponse?.sum)
        );
      }
      if (unCertifiedByMeAggregationResponse) {
        setProgrammesUnCertifed(parseInt(unCertifiedByMeAggregationResponse?.uncertifiedCount));
      }
      if (
        response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime &&
        String(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime) !== '0'
      ) {
        setLastUpdateProgrammesStatsEpoch(
          parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
        );
        setLastUpdateProgrammesStats(
          moment(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
          ).fromNow()
        );
      }
      if (
        response?.data?.stats?.PENDING_TRANSFER_INIT?.all?.txTime &&
        String(response?.data?.stats?.PENDING_TRANSFER_INIT?.all?.txTime) !== '0'
      ) {
        setLastUpdatePendingTransferSentEpoch(
          parseInt(response?.data?.stats?.PENDING_TRANSFER_INIT?.all?.txTime)
        );
        setLastUpdatePendingTransferSent(
          moment(parseInt(response?.data?.stats?.PENDING_TRANSFER_INIT?.all?.txTime)).fromNow()
        );
      }
      if (
        response?.data?.stats?.MY_CREDIT?.last &&
        String(response?.data?.stats?.MY_CREDIT?.last) !== '0'
      ) {
        setLastUpdateCreditBalanceEpoch(parseInt(response?.data?.stats?.MY_CREDIT?.last));
        setLastUpdateCreditBalance(
          moment(parseInt(response?.data?.stats?.MY_CREDIT?.last)).fromNow()
        );
      }
      if (
        response?.data?.stats?.UNCERTIFIED_BY_ME?.last &&
        String(response?.data?.stats?.UNCERTIFIED_BY_ME?.last) !== '0'
      ) {
        setLastUpdateProgrammesCertifiableEpoch(
          parseInt(response?.data?.stats?.UNCERTIFIED_BY_ME?.last)
        );
        setLastUpdateProgrammesCertifiable(
          moment(parseInt(response?.data?.stats?.UNCERTIFIED_BY_ME?.last)).fromNow()
        );
      }
      if (
        response?.data?.stats?.CERTIFIED_BY_ME?.last &&
        String(response?.data?.stats?.CERTIFIED_BY_ME?.last) !== '0'
      ) {
        setLastUpdateProgrammesCertifiedEpoch(
          parseInt(response?.data?.stats?.CERTIFIED_BY_ME?.last)
        );
        setLastUpdateProgrammesCertified(
          moment(parseInt(response?.data?.stats?.CERTIFIED_BY_ME?.last)).fromNow()
        );
      }
      if (
        response?.data?.stats?.PENDING_TRANSFER_RECV?.last &&
        String(response?.data?.stats?.PENDING_TRANSFER_RECV?.last) !== '0'
      ) {
        setLastUpdatePendingTransferReceivedEpoch(
          parseInt(response?.data?.stats?.PENDING_TRANSFER_RECV?.last)
        );
        setLastUpdatePendingTransferReceived(
          moment(parseInt(response?.data?.stats?.PENDING_TRANSFER_RECV?.last)).fromNow()
        );
      }
    } catch (error: any) {
      console.log('Error in getting users', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoadingWithoutTimeRange(false);
    }
  };

  const getAllProgrammeAnalyticsStats = async () => {
    setLoading(true);
    const pieSeriesCreditsData: any[] = [];
    const pieSeriesCreditsCerifiedData: any[] = [];
    try {
      const response: any = await post(
        'stats/programme/agg',
        getAllProgrammeAnalyticsStatsParams(),
        undefined,
        statServerUrl
      );
      let programmeByStatusAggregationResponse: any;
      let programmeByStatusAuthAggregationResponse: any;
      let certifiedRevokedAggregationResponse: any;
      if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
        if (
          response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime &&
          String(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime) !== '0'
        ) {
          setLastUpdateProgrammesStatsCEpoch(
            parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
          );
          setLastUpdateProgrammesStatsC(
            moment(
              parseInt(response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
            ).fromNow()
          );
        }
        programmeByStatusAggregationResponse =
          response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.MY_AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.MY_AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !==
            '0'
        ) {
          setLastUpdateProgrammesCreditsStatsEpoch(
            parseInt(response?.data?.stats?.MY_AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateProgrammesCreditsStats(
            moment(
              parseInt(
                response?.data?.stats?.MY_AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime
              )
            ).fromNow()
          );
        }
        programmeByStatusAuthAggregationResponse =
          response?.data?.stats?.MY_AGG_AUTH_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateCertifiedCreditsStatsEpoch(
            parseInt(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateCertifiedCreditsStats(
            moment(parseInt(response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
      } else if (userInfoState?.companyRole === CompanyRole.CERTIFIER && categoryType === 'mine') {
        if (
          response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.all?.certifiedTime &&
          String(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.all?.certifiedTime) !== '0'
        ) {
          setLastUpdateProgrammesStatsCEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.all?.certifiedTime)
          );
          setLastUpdateProgrammesStatsC(
            moment(
              parseInt(response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.all?.certifiedTime)
            ).fromNow()
          );
        } else {
          setLastUpdateProgrammesStatsCEpoch(0);
          setLastUpdateProgrammesStatsC('0');
        }
        programmeByStatusAggregationResponse =
          response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.data;
        if (
          response?.data?.stats?.AUTH_CERTIFIED_BY_ME_BY_STATE?.last &&
          String(response?.data?.stats?.AUTH_CERTIFIED_BY_ME_BY_STATE?.last) !== '0'
        ) {
          setLastUpdateProgrammesCreditsStatsEpoch(
            parseInt(response?.data?.stats?.AUTH_CERTIFIED_BY_ME_BY_STATE?.last)
          );
          setLastUpdateProgrammesCreditsStats(
            moment(parseInt(response?.data?.stats?.AUTH_CERTIFIED_BY_ME_BY_STATE?.last)).fromNow()
          );
        } else {
          setLastUpdateProgrammesCreditsStatsEpoch(0);
          setLastUpdateProgrammesCreditsStats('0');
        }
        programmeByStatusAuthAggregationResponse =
          response?.data?.stats?.AUTH_CERTIFIED_BY_ME_BY_STATE?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last) !== '0'
        ) {
          setLastUpdateCertifiedCreditsStatsEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last)
          );
          setLastUpdateCertifiedCreditsStats(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.last)).fromNow()
          );
        } else {
          setLastUpdateCertifiedCreditsStatsEpoch(0);
          setLastUpdateCertifiedCreditsStats('0');
        }
        certifiedRevokedAggregationResponse = response?.data?.stats?.CERTIFIED_REVOKED_BY_ME?.data;
      } else if (
        userInfoState?.companyRole === CompanyRole.CERTIFIER &&
        categoryType === 'overall'
      ) {
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime) !== '0'
        ) {
          setLastUpdateProgrammesStatsCEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
          );
          setLastUpdateProgrammesStatsC(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
            ).fromNow()
          );
        }
        programmeByStatusAggregationResponse = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !== '0'
        ) {
          setLastUpdateProgrammesCreditsStatsEpoch(
            parseInt(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateProgrammesCreditsStats(
            moment(
              parseInt(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
            ).fromNow()
          );
        }
        programmeByStatusAuthAggregationResponse =
          response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateCertifiedCreditsStatsEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateCertifiedCreditsStats(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
      } else {
        if (
          response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime &&
          String(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime) !== '0'
        ) {
          setLastUpdateProgrammesStatsCEpoch(
            parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
          );
          setLastUpdateProgrammesStatsC(
            moment(
              parseInt(response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.all?.statusUpdateTime)
            ).fromNow()
          );
        }
        programmeByStatusAggregationResponse = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime &&
          String(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime) !== '0'
        ) {
          setLastUpdateProgrammesCreditsStatsEpoch(
            parseInt(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
          );
          setLastUpdateProgrammesCreditsStats(
            moment(
              parseInt(response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.all?.creditUpdateTime)
            ).fromNow()
          );
        }
        programmeByStatusAuthAggregationResponse =
          response?.data?.stats?.AGG_AUTH_PROGRAMME_BY_STATUS?.data;
        if (
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last &&
          String(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last) !== '0'
        ) {
          setLastUpdateCertifiedCreditsStatsEpoch(
            parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)
          );
          setLastUpdateCertifiedCreditsStats(
            moment(parseInt(response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.last)).fromNow()
          );
        }
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
      }
      let totalProgrammes: any = 0;
      let totalEstCredits: any = 0;
      let totalIssuedCredits: any = 0;
      let totalRetiredCredits: any = 0;
      let totalBalancecredit: any = 0;
      let totalTxCredits: any = 0;
      let totalFrozenCredits: any = 0;
      let totalCertifiedCredit: any = 0;
      let totalUnCertifiedredit: any = 0;
      let totalRevokedCredits: any = 0;
      let pendingProgrammesC: any = 0;
      let authorisedProgrammesC: any = 0;
      let rejectedProgrammesC: any = 0;
      const programmeStatusA = Object.values(ProgrammeStageLegend);
      if (programmeByStatusAggregationResponse?.length > 0) {
        programmeByStatusAggregationResponse?.map((responseItem: any, index: any) => {
          if (
            ProgrammeStageR.AwaitingAuthorization === getStageEnumVal(responseItem?.currentStage)
          ) {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            pendingProgrammesC = parseInt(responseItem?.count);
          }
          if ([ProgrammeStageR.Rejected].includes(responseItem?.currentStage)) {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            rejectedProgrammesC = parseInt(responseItem?.count);
          }
          if ([ProgrammeStageR.Authorised].includes(responseItem?.currentStage)) {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            authorisedProgrammesC = parseInt(responseItem?.count);
          }
        });
        setTotalProjects(totalProgrammes);
        setPendingProjects(pendingProgrammesC);
        setAuthorisedProjects(authorisedProgrammesC);
        setRejectedProjects(rejectedProgrammesC);
      } else {
        setPendingProjects(0);
        setAuthorisedProjects(0);
        setRejectedProjects(0);
        setTotalProjects(0);
      }
      if (programmeByStatusAuthAggregationResponse?.length > 0) {
        programmeByStatusAuthAggregationResponse?.map((responseItem: any) => {
          totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
          totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
          totalRetiredCredits = totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
          totalBalancecredit = totalBalancecredit + parseFloat(responseItem?.totalbalancecredit);
          totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
          totalFrozenCredits = totalFrozenCredits + parseFloat(responseItem?.totalfreezecredit);
        });
      }
      if (certifiedRevokedAggregationResponse) {
        totalCertifiedCredit = parseFloat(certifiedRevokedAggregationResponse?.certifiedSum);
        totalUnCertifiedredit = parseFloat(certifiedRevokedAggregationResponse?.uncertifiedSum);
        totalRevokedCredits = parseFloat(certifiedRevokedAggregationResponse?.revokedSum);
      }
      setCreditBalance(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      const creditAuthorized = totalEstCredits - totalIssuedCredits;
      const creditIssued =
        totalIssuedCredits - totalTxCredits - totalRetiredCredits - totalFrozenCredits;
      pieSeriesCreditsData.push(addRoundNumber(creditAuthorized));
      pieSeriesCreditsData.push(addRoundNumber(creditIssued));
      pieSeriesCreditsData.push(addRoundNumber(totalTxCredits));
      pieSeriesCreditsData.push(addRoundNumber(totalRetiredCredits));
      pieSeriesCreditsData.push(addRoundNumber(totalFrozenCredits));

      pieSeriesCreditsCerifiedData.push(addRoundNumber(totalCertifiedCredit));
      pieSeriesCreditsCerifiedData.push(addRoundNumber(totalUnCertifiedredit));
      pieSeriesCreditsCerifiedData.push(addRoundNumber(totalRevokedCredits));
      const totalCreditsCertified = addRoundNumber(
        totalCertifiedCredit + totalUnCertifiedredit + totalRevokedCredits
      );
      setCreditsPieChartTotal(
        String(addCommSep(totalEstCredits)) !== 'NaN' ? addCommSep(totalEstCredits) : 0
      );
      setCertifiedCreditsPieChartTotal(addCommSep(totalCreditsCertified));
      const output = '<p>' + 'ITMOs' + '</p><p>' + addCommSep(totalCreditsCertified) + '</p>';
      optionDonutPieA.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + String(addCommSep(totalEstCredits)) !== 'NaN' ? addCommSep(totalEstCredits) : 0;
      optionDonutPieB.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + addCommSep(totalCreditsCertified);
      setCreditPieSeries(pieSeriesCreditsData);
      setCreditCertifiedPieSeries(pieSeriesCreditsCerifiedData);
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

  useEffect(() => {
    getAllProgrammeAnalyticsStatsWithoutTimeRange();
    if (userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      setCategoryType('mine');
    }
  }, []);

  useEffect(() => {
    getAllProgrammeAnalyticsStats();
    getAllProgrammesAggChartStats();
  }, [startTime, endTime, categoryType]);

  useEffect(() => {
    ApexCharts.exec('total-programmes-sector', 'updateSeries', {
      data: totalProgrammesSectorSeries,
    });
    ApexCharts.exec('total-programmes-sector', 'updateOptions', {
      xaxis: {
        categories: totalProgrammesSectorOptionsLabels,
      },
    });
  }, [totalProgrammesSectorSeries, categoryType, totalProgrammesSectorOptionsLabels]);

  useEffect(() => {
    ApexCharts.exec('total-programmes', 'updateSeries', {
      data: totalProgrammesSeries,
    });
    ApexCharts.exec('total-programmes', 'updateOptions', {
      xaxis: {
        categories: totalProgrammesOptionsLabels,
      },
    });
  }, [totalProgrammesSeries, categoryType, totalProgrammesOptionsLabels]);

  useEffect(() => {
    ApexCharts.exec('total-credits', 'updateSeries', {
      data: totalCreditsSeries,
    });
    ApexCharts.exec('total-credits', 'updateOptions', {
      xaxis: {
        categories: totalCreditsOptionsLabels,
      },
    });
  }, [totalCreditsSeries, categoryType, totalCreditsOptionsLabels]);

  useEffect(() => {
    ApexCharts.exec('total-credits-certified', 'updateSeries', {
      data: totalCertifiedCreditsSeries,
    });
    ApexCharts.exec('total-credits-certified', 'updateOptions', {
      xaxis: {
        categories: totalCertifiedCreditsOptionsLabels,
      },
    });
  }, [totalCertifiedCreditsSeries, categoryType, totalCertifiedCreditsOptionsLabels]);

  useEffect(() => {
    ApexCharts.exec('credits', 'updateSeries', {
      series: creditsPieSeries,
    });
    ApexCharts.exec('credits', 'updateOptions', {
      plotOptions: {
        pie: {
          labels: {
            total: {
              formatter: () => creditsPieChartTotal,
            },
          },
        },
      },
    });
  }, [creditsPieSeries, categoryType, creditsPieChartTotal]);

  useEffect(() => {
    ApexCharts.exec('certified-credits', 'updateSeries', {
      series: creditsCertifiedPieSeries,
    });
    ApexCharts.exec('credits', 'updateOptions', {
      plotOptions: {
        pie: {
          labels: {
            total: {
              formatter: () => certifiedCreditsPieChartTotal,
            },
          },
        },
      },
    });
  }, [creditsCertifiedPieSeries, categoryType, certifiedCreditsPieChartTotal]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdateProgrammesStatsEpoch !== 0) {
        setLastUpdateProgrammesStats(moment(lastUpdateProgrammesStatsEpoch).fromNow());
      }
      if (lastUpdateProgrammesStatsCEpoch !== 0) {
        setLastUpdateProgrammesStatsC(moment(lastUpdateProgrammesStatsCEpoch).fromNow());
      }
      if (lastUpdatePendingTransferSentEpoch !== 0) {
        setLastUpdatePendingTransferSent(moment(lastUpdatePendingTransferSentEpoch).fromNow());
      }
      if (lastUpdateCreditBalanceEpoch !== 0) {
        setLastUpdateCreditBalance(moment(lastUpdateCreditBalanceEpoch).fromNow());
      }
      if (lastUpdatePendingTransferReceivedEpoch !== 0) {
        setLastUpdatePendingTransferReceived(
          moment(lastUpdatePendingTransferReceivedEpoch).fromNow()
        );
      }
      if (lastUpdateProgrammesCertifiableEpoch !== 0) {
        setLastUpdateProgrammesCertifiable(moment(lastUpdateProgrammesCertifiableEpoch).fromNow());
      }
      if (lastUpdateProgrammesCertifiedEpoch !== 0) {
        setLastUpdateProgrammesCertified(moment(lastUpdateProgrammesCertifiedEpoch).fromNow());
      }
      if (lastUpdateCertifiedCreditsStatsEpoch !== 0) {
        setLastUpdateCertifiedCreditsStats(moment(lastUpdateCertifiedCreditsStatsEpoch).fromNow());
      }
      if (lastUpdateProgrammesCreditsStatsEpoch !== 0) {
        setLastUpdateProgrammesCreditsStats(
          moment(lastUpdateProgrammesCreditsStatsEpoch).fromNow()
        );
      }
      if (lastUpdateProgrammesSectorStatsCEpoch !== 0) {
        setLastUpdateProgrammesSectorStatsC(
          moment(lastUpdateProgrammesSectorStatsCEpoch).fromNow()
        );
      }
      if (lastUpdateTotalCreditsEpoch !== 0) {
        setLastUpdateTotalCredits(moment(lastUpdateTotalCreditsEpoch).fromNow());
      }
      if (lastUpdateTotalCreditsCertifiedEpoch !== 0) {
        setLastUpdateTotalCreditsCertified(moment(lastUpdateTotalCreditsCertifiedEpoch).fromNow());
      }
      if (lastUpdateTransferLocationsEpoch !== 0) {
        setLastUpdateTransferLocations(moment(lastUpdateTransferLocationsEpoch).fromNow());
      }
    }, 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, [
    lastUpdateProgrammesStatsEpoch,
    lastUpdateProgrammesStatsCEpoch,
    lastUpdatePendingTransferSentEpoch,
    lastUpdateCreditBalanceEpoch,
    lastUpdatePendingTransferReceivedEpoch,
    lastUpdateProgrammesCertifiableEpoch,
    lastUpdateProgrammesCertifiedEpoch,
    lastUpdateProgrammesCreditsStatsEpoch,
    lastUpdateCertifiedCreditsStatsEpoch,
    lastUpdateProgrammesSectorStatsCEpoch,
    lastUpdateTotalCreditsEpoch,
    lastUpdateTotalCreditsCertifiedEpoch,
    lastUpdateTransferLocationsEpoch,
  ]);

  const countS = ['all', ['>=', ['get', 'count'], 0]];
  const pending = ['all', ['==', ['get', 'stage'], 'AwaitingAuthorization']];
  const authorised = ['all', ['==', ['get', 'stage'], 'Authorised']];
  const rejected = ['all', ['==', ['get', 'stage'], 'Rejected']];
  const news = ['all', ['==', ['get', 'stage'], 'Approved']];

  const colors = ['#6ACDFF', '#CDCDCD', '#FF8183', '#B7A4FE'];

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
        properties.new,
      ];
    } else {
      if (properties?.stage === 'AwaitingAuthorization') {
        programmeStageCounts = [0, 0, properties.count, 0];
      } else if (properties?.stage === 'Authorised') {
        programmeStageCounts = [properties.count, 0, 0, 0];
      } else if (properties?.stage === 'Rejected') {
        programmeStageCounts = [0, properties.count, 0, 0];
      } else if (properties?.stage === 'New') {
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
          colors[i]
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

  useEffect(() => {
    setTimeout(() => {
      const mapSource: MapSourceData = {
        key: 'countries',
        data: {
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1',
        },
      };

      setTransferLocationsMapSource(mapSource);

      // Build a GL match expression that defines the color for every vector tile feature
      // Use the ISO 3166-1 alpha 3 code as the lookup key for the country shape
      const matchExpression: any = ['match', ['get', 'iso_3166_1']];
      const txLocationMap: any = {};

      if (programmeTransferLocations) {
        const transferLocations: any = [...programmeTransferLocations];

        // Calculate color values for each country based on 'hdi' value
        for (const row of transferLocations) {
          // Convert the range of data values to a suitable color
          // const blue = row.ratio * 255;

          const color =
            row.count < 2
              ? `#4da6ff`
              : row.count < 10
              ? '#0080ff'
              : row.count < 50
              ? '#0059b3'
              : row.count < 100
              ? '#003366'
              : '#000d1a';

          matchExpression.push(row.country, color);
          txLocationMap[row.country] = row.count;
        }
      }

      setTxLocationMapData(txLocationMap);

      matchExpression.push('rgba(0, 0, 0, 0)');

      setTransferLocationsMapLayer({
        id: 'countries-join',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': matchExpression,
        },
      });
    }, 1000);
  }, [programmeTransferLocations]);

  useEffect(() => {
    setTimeout(() => {
      setProgrammeLocationsMapCenter(
        programmeLocations?.features && programmeLocations?.features[0]?.geometry?.coordinates
          ? programmeLocations?.features[0]?.geometry?.coordinates
          : [7.4924165, 5.5324032]
      );

      const mapSource: MapSourceData = {
        key: 'programmeLocations',
        data: {
          type: 'geojson',
          data: programmeLocations,
          cluster: true,
          clusterRadius: 40,
          clusterProperties: {
            // keep separate counts for each programmeStage category in a cluster
            count: ['+', ['case', countS, ['get', 'count'], 0]],
            pending: ['+', ['case', pending, ['get', 'count'], 0]],
            authorised: ['+', ['case', authorised, ['get', 'count'], 0]],
            rejected: ['+', ['case', rejected, ['get', 'count'], 0]],
            new: ['+', ['case', news, ['get', 'count'], 0]],
          },
        },
      };

      setProgrammeLocationsMapSource(mapSource);

      setProgrammeLocationsMapLayer({
        id: 'programmes_circle',
        type: 'circle',
        source: 'programmeLocations',
        filter: ['!=', 'cluster', true],
        paint: {
          'circle-color': ['case', pending, colors[0], authorised, colors[1], colors[2]],
          'circle-opacity': 1,
          'circle-radius': 10,
        },
      });
    }, 1000);
  }, [programmeLocations]);

  const onChangeCategory = (event: any) => {
    setCategoryType(event?.target?.value);
  };

  const transferLocationsMapOnClick = function (map: any, e: any) {
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['countries-join'],
    });
    if (!features.length) {
      return;
    }

    const feature = features[0];
    if (!txLocationMapData[feature.properties?.iso_3166_1]) {
      return;
    }

    return `${feature.properties?.name_en} : ${txLocationMapData[feature.properties?.iso_3166_1]}`;
  };

  // Use the same approach as above to indicate that the symbols are clickable
  // by changing the cursor style to 'pointer'.
  const transferLocationsMapOnMouseMove = function (map: any, e: any) {
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['countries-join'],
    });
    map.getCanvas().style.cursor =
      features.length > 0 && txLocationMapData[features[0].properties?.iso_3166_1] ? 'pointer' : '';
  };

  const programmeLocationsMapOnRender = function (map: any) {
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
  };
  const fetchProgrammeIds = async () => {
    try {
      const responses = await post('national/programme/queryDocs', {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'type',
            operation: '=',
            value: '6',
          },
        ],
      });
      // eslint-disable-next-line prefer-const
      let data = await responses.data;
      if (data && data.length > 0) {
        // response.data.map((item:any)=>{
        //   setFileList(item?.programmeId)
        //   setSelectedurl(item?.url)
        // })
        // setFileList(responses.data[0] ?? [])

        const initlist = [];
        for (let i = 0; i < data.length; i++) {
          const newreports = {
            label: data[i].programmeId.slice(2),
            key: data[i].url,
          };
          initlist.push(newreports);
        }
        setFileList(initlist);
      }
    } catch (error) {
      console.error('Error fetching AnnualReports:', error);
    }
  };
  useEffect(() => {
    if (userInfoState?.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
      fetchProgrammeIds();
    }
  }, []);
  const fileListFlat = fileList.flat();
  const items: MenuProps['items'] = fileListFlat.map((item) => ({
    label: item.label,
    key: item.key,
  }));

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setSelectedurl(String(e.key));
    const parts = String(e.key).split('/');
    const fileName = parts[parts.length - 1];
    const fileNameWithoutExtension = fileName.replace('.pdf', '');
    const lastFourElements = fileNameWithoutExtension.slice(-4);
    setSelectedFile(lastFourElements);
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <div className="dashboard-main-container">
      {/* {isMultipleDashboardsVisible && (
        <div className="systemchange-container" style={{ marginLeft: `20px` }}>
          <ButtonGroup>
            <Button type="primary" className="rgprimary">
              Carbon Registry
            </Button>
            <Link to="/dashboard/mrv">
              <Button className="mid-default-btn">Transparency System</Button>
            </Link>
            <Link to="/dashboard/ghg">
              <Button className="rgdefault">GHG Inventory</Button>
            </Link>
          </ButtonGroup>
        </div>
      )} */}
      <div className="stastics-cards-container" style={{ marginTop: `50px` }}>
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? pendingProjectsWithoutTimeRange
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? transferRequestReceived
                  : programmesUnCertifed
              }
              title={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'programmesPending'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'trasnferReqReceived'
                  : 'programmesUnCertified'
              }
              updatedDate={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? lastUpdateProgrammesStats
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? lastUpdatePendingTransferReceived
                  : lastUpdateProgrammesCertifiable
              }
              icon={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT ? (
                  <ClockHistory color="#16B1FF" size={80} />
                ) : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                  <BoxArrowInRight color="#16B1FF" size={80} />
                ) : (
                  <ShieldX color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
              companyRole={userInfoState?.companyRole}
              tooltip={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTprogrammespendingGoverment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTransferReqRecProgrammeDev'
                  : 'tTProgrammesUnCertiCertifier'
              )}
              t={t}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? transferRequestSent
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? transferRequestSent
                  : programmesCertifed
              }
              title={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'trasnferReqInit'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'trasnferReqInit'
                  : 'programmesCertified'
              }
              updatedDate={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? lastUpdatePendingTransferSent
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? lastUpdatePendingTransferSent
                  : lastUpdateProgrammesCertified
              }
              icon={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT ? (
                  <BoxArrowRight color="#16B1FF" size={80} />
                ) : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                  <BoxArrowRight color="#16B1FF" size={80} />
                ) : (
                  <ShieldCheck color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
              companyRole={userInfoState?.companyRole}
              tooltip={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTTransferReqSentGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTransferReqInitProgrammeDev'
                  : 'tTProgrammesCertiCertifier'
              )}
              t={t}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? creditBalanceWithoutTimeRange
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? creditBalanceWithoutTimeRange
                  : creditCertiedBalanceWithoutTimeRange
              }
              title={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'creditBal'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'creditBal'
                  : 'creditCertified'
              }
              updatedDate={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? lastUpdateCreditBalance
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? lastUpdateCreditBalance
                  : lastUpdateProgrammesCertified
              }
              icon={
                userInfoState?.companyRole === CompanyRole.GOVERNMENT ? (
                  <Gem color="#16B1FF" size={80} />
                ) : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                  <Gem color="#16B1FF" size={80} />
                ) : (
                  <ShieldExclamation color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
              companyRole={userInfoState?.companyRole}
              tooltip={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTCreditBalanceGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTCreditBalanceProgrammeDev'
                  : 'tTCreditCertifiedCertifier'
              )}
              t={t}
            />
          </Col>
        </Row>
      </div>
      {(userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
        userInfoState?.companyRole === CompanyRole.CERTIFIER ||
        userInfoState?.companyRole === CompanyRole.MINISTRY) &&
        fileList.length > 0 && (
          <div className="annual-report">
            <div>Annual Statistics Report</div>
            <Dropdown menu={menuProps}>
              <Button className="annual-report-dropdownbutton">
                <Space>
                  {selectedFile}
                  <CaretDownOutlined />
                </Space>
              </Button>
            </Dropdown>
            {selectedurl.trim().length === 0 && (
              <Button className="annual-report-downloadbutton">
                <Space>
                  <BookOutlined className="common-progress-icon" style={{ color: '#3F3A47' }} />
                </Space>
              </Button>
            )}
            {selectedurl.trim().length > 0 && (
              <a href={selectedurl} target="_blank" rel="noopener noreferrer" download>
                <Button className="annual-report-downloadbutton">
                  <Space>
                    <BookOutlined className="common-progress-icon" style={{ color: '#3F3A47' }} />
                  </Space>
                </Button>
              </a>
            )}
          </div>
        )}
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
        <div className="radio-selection">
          {userInfoState?.companyRole === CompanyRole.CERTIFIER && (
            <Radio.Group value={categoryType} onChange={onChangeCategory}>
              <Radio.Button className="overall" value="overall">
                OVERALL
              </Radio.Button>
              <Radio.Button className="mine" value="mine">
                MINE
              </Radio.Button>
            </Radio.Group>
          )}
        </div>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <ProgrammeRejectAndTransferComponent
              totalPrgrammes={totalProjects}
              pending={pendingProjects}
              rejected={rejectedProjects}
              authorized={authorisedProjects}
              updatedDate={lastUpdateProgrammesStatsC}
              loading={loading}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTProgrammesGoverment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTProgrammesProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTProgrammesCertifierMine'
                  : 'tTProgrammesCertifierOverall'
              )}
              t={t}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col pie">
            <RegistryPieChartsStatComponent
              id="credits"
              title={t('credits')}
              options={optionDonutPieA}
              series={creditsPieSeries}
              lastUpdate={lastUpdateProgrammesCreditsStats}
              loading={loading}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTCreditsGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTCreditsProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTCreditsCertifierMine'
                  : 'tTCreditsCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <RegistryPieChartsStatComponent
              id="certified-credits"
              title={t('certifiedCredits')}
              options={optionDonutPieB}
              series={creditsCertifiedPieSeries}
              lastUpdate={lastUpdateCertifiedCreditsStats}
              loading={loading}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTCertifiedCreditsGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTCertifiedCreditsProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTCertifiedCreditsCertifierMine'
                  : 'tTCertifiedCreditsCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <RegistryBarChartsStatComponent
              id="total-programmes"
              title={t('totalProgrammes')}
              options={totalProgrammesOptions}
              series={totalProgrammesSeries}
              lastUpdate={lastUpdateProgrammesStatsC}
              loading={loadingCharts}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTTotalProgrammesGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTotalProgrammesProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTTotalProgrammesCertifierMine'
                  : 'tTTotalProgrammesCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <RegistryBarChartsStatComponent
              id="total-programmes-sector"
              title={t('totalProgrammesSector')}
              options={totalProgrammesOptionsSub}
              series={totalProgrammesSectorSeries}
              lastUpdate={lastUpdateProgrammesSectorStatsC}
              loading={loadingCharts}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTTotalProgrammesSectorGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTotalProgrammesSecProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTTotalProgrammesSecCertifierMine'
                  : 'tTTotalProgrammesSecCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <RegistryBarChartsStatComponent
              id="total-credits"
              title={t('totalCredits')}
              options={totalCreditsOptions}
              series={totalCreditsSeries}
              lastUpdate={lastUpdateTotalCredits}
              loading={loadingCharts}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTTotalCreditsGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTotalCreditsProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTTotalCreditsCertifierMine'
                  : 'tTTotalCreditsCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <RegistryBarChartsStatComponent
              id="total-credits-certified"
              title={t('totalCreditsCertified')}
              options={totalCreditsCertifiedOptions}
              series={totalCertifiedCreditsSeries}
              lastUpdate={lastUpdateTotalCreditsCertified}
              loading={loadingCharts}
              toolTipText={t(
                userInfoState?.companyRole === CompanyRole.GOVERNMENT
                  ? 'tTTotalCreditsCertifiedGovernment'
                  : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                  ? 'tTTotalCertifiedCreditsProgrammeDev'
                  : categoryType === 'mine'
                  ? 'tTTotalCertifiedCreditsCertifierMine'
                  : 'tTTotalCertifiedCreditsCertifierOverall'
              )}
              Chart={Chart}
            />
          </Col>
        </Row>
      </div>
      {mapType !== MapTypes.None ? (
        <div className="stastics-and-charts-container center">
          <Row gutter={[40, 40]} className="stastic-card-row">
            <Col xxl={12} xl={12} md={12} className="stastic-card-col">
              <div className="stastics-and-pie-card height-map-rem">
                <div className="pie-charts-top">
                  <div className="pie-charts-title">{t('programmeLocations')}</div>
                  <div className="info-container">
                    <div className="info-container">
                      <Tooltip
                        arrowPointAtCenter
                        placement="bottomRight"
                        trigger="hover"
                        title={t(
                          userInfoState?.companyRole === CompanyRole.GOVERNMENT
                            ? 'tTProgrammeLocationsGovernment'
                            : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                            ? 'tTProgrammeLocationsProgrammeDev'
                            : categoryType === 'mine'
                            ? 'tTProgrammeLocationsCertifierMine'
                            : 'tTProgrammeLocationsCertifierOverall'
                        )}
                      >
                        <InfoCircle color="#000000" size={17} />
                      </Tooltip>
                    </div>
                  </div>
                </div>
                {loadingCharts ? (
                  <div className="margin-top-2">
                    <Skeleton active />
                    <Skeleton active />
                  </div>
                ) : (
                  <>
                    <div className="map-content">
                      <MapComponent
                        mapType={mapType}
                        center={programmeLocationsMapCenter}
                        zoom={4}
                        mapSource={programmeLocationsMapSource}
                        layer={programmeLocationsMapLayer}
                        height={360}
                        style="mapbox://styles/mapbox/light-v11"
                        onRender={programmeLocationsMapOnRender}
                        accessToken={accessToken}
                      ></MapComponent>
                    </div>
                    <div className="stage-legends">
                      <LegendItem text="Authorised" color="#6ACDFF" />
                      {!(
                        userInfoState?.companyRole === CompanyRole.CERTIFIER &&
                        categoryType === 'mine'
                      ) && (
                        <>
                          <LegendItem text="Rejected" color="#CDCDCD" />
                          <LegendItem text="Pending" color="#FF8183" />
                          <LegendItem text="Approved" color="#B7A4FE" />
                        </>
                      )}
                    </div>
                    <div className="updated-on margin-top-1">
                      <div className="updated-moment-container">
                        {lastUpdateProgrammesStatsC !== '0' && lastUpdateProgrammesStatsC}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Col>
            <Col xxl={12} xl={12} md={12} className="stastic-card-col">
              <div className="stastics-and-pie-card height-map-rem">
                <div className="pie-charts-top">
                  <div className="pie-charts-title">{t('trasnferLocations')}</div>
                  <div className="info-container">
                    <Tooltip
                      arrowPointAtCenter
                      placement="bottomRight"
                      trigger="hover"
                      title={t(
                        userInfoState?.companyRole === CompanyRole.GOVERNMENT
                          ? 'tTTransferLocationsGovernment'
                          : userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER
                          ? 'tTTrasnferLocationsProgrammeDev'
                          : categoryType === 'mine'
                          ? 'tTTrasnferLocationsCertifierMine'
                          : 'tTTrasnferLocationsCertifierOverall'
                      )}
                    >
                      <InfoCircle color="#000000" size={17} />
                    </Tooltip>
                  </div>
                </div>
                {loadingCharts ? (
                  <div className="margin-top-2">
                    <Skeleton active />
                    <Skeleton active />
                  </div>
                ) : (
                  <>
                    <div className="map-content">
                      <MapComponent
                        mapType={mapType}
                        center={[12, 50]}
                        zoom={0.5}
                        mapSource={transferLocationsMapSource}
                        onClick={transferLocationsMapOnClick}
                        showPopupOnClick={true}
                        onMouseMove={transferLocationsMapOnMouseMove}
                        layer={transferLocationsMapLayer}
                        height={360}
                        style="mapbox://styles/mapbox/streets-v11"
                        accessToken={accessToken}
                      ></MapComponent>
                    </div>
                    <div className="updated-on margin-top-2">
                      <div className="updated-moment-container">
                        {lastUpdateTransferLocations !== '0' && lastUpdateTransferLocations}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
