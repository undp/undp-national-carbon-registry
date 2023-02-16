import React, { useEffect, useRef, useState } from 'react';
import { Col, DatePicker, Progress, Radio, Row, Skeleton, message } from 'antd';
import 'mapbox-gl/dist/mapbox-gl.css';
import StasticCard from '../../Components/StasticCard/StasticCard';
import './dashboard.scss';
import {
  optionDonutPieA,
  optionDonutPieB,
  totalCreditsCertifiedOptions,
  totalCreditsOptions,
  totalProgrammesOptions,
  totalProgrammesOptionsSub,
} from './CHART_OPTIONS';
import ProgrammeRejectAndTransfer from './ProgrammeRejectAndTransfer';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import mapboxgl from 'mapbox-gl';
import { addCommSep } from '../../Definitions/InterfacesAndType/programme.definitions';
import {
  ClockHistory,
  BoxArrowInRight,
  ShieldX,
  ShieldExclamation,
  BoxArrowRight,
  ShieldCheck,
  Gem,
} from 'react-bootstrap-icons';
import PieChartsStat from './pieChartStat';
import BarChartsStat from './barChartStats';
import LegendItem from '../../Components/LegendItem/legendItem';
import {
  ChartSeriesItem,
  totalCertifiedCreditsSeriesInitialValues,
  totalCreditsSeriesInitialValues,
  totalProgrammesInitialValues,
  totalProgrammmesSectorInitialValues,
} from './dashboardTypesInitialValues';
import { Sector } from '../../Casl/enums/sector.enum';
import { ProgrammeStageLegend } from '../../Casl/enums/programme-status.enum';

const { RangePicker } = DatePicker;

mapboxgl.accessToken =
  '';

const Dashboard = () => {
  const { get, post, delete: del } = useConnection();
  const mapContainerRef = useRef(null);
  const mapContainerInternationalRef = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any>([]);
  const [companyRole, setCompanyRole] = useState<any>();
  const [loadingWithoutTimeRange, setLoadingWithoutTimeRange] = useState<boolean>(false);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [pendingProjects, setPendingProjects] = useState<number>(0);
  const [pendingProjectsWithoutTimeRange, setPendingProjectsWithoutTimeRange] = useState<number>(0);
  const [issuedProjects, setIssuedProjects] = useState<number>(0);
  const [rejectedProjects, setRejectedProjects] = useState<number>(0);
  const [authorisedProjects, setAuthorisedProjects] = useState<number>(0);
  const [transfererequestsSent, setTransfererequestsSent] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditBalanceWithoutTimeRange, setCreditBalanceWithoutTimeRange] = useState<number>(0);
  const [creditCertiedBalanceWithoutTimeRange, setCreditCertifiedBalanceWithoutTimeRange] =
    useState<number>(0);
  const [creditsPieSeries, setCreditPieSeries] = useState<number[]>([1, 1, 0, 0]);
  const [creditsCertifiedPieSeries, setCreditCertifiedPieSeries] = useState<number[]>([1, 1, 0]);
  const [lastUpdate, setLastUpdate] = useState<any>();
  const [lastUpdateProgrammesStats, setLastUpdateProgrammesStats] = useState<any>();

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [categoryType, setCategoryType] = useState<string>('overall');

  // states for totalProgrammes chart
  const [totalProgrammesSeries, setTotalProgrammesSeries] = useState<ChartSeriesItem[]>(
    totalProgrammesInitialValues
  );
  const [totalProgrammesOptionsLabels, setTotalProgrammesOptionsLabels] = useState<any[]>([]);

  // states for totalProgrammes sub sector chart
  const [totalProgrammesSectorSeries, setTotalProgrammesSectorSeries] = useState<ChartSeriesItem[]>(
    totalProgrammmesSectorInitialValues
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
  const [certifcationsRevoked, setCertifcationsRevoked] = useState<number>(20);

  //programmeDeveloper
  const [transferRequestSent, setTransferRequestSent] = useState<number>(0);
  const [transferRequestReceived, setTransferRequestReceived] = useState<number>(0);

  const currentYear = new Date();

  const getUserProfileDetails = async () => {
    try {
      setLoading(true);
      const response = await get('national/User/profile');
      if (response.data) {
        setUserDetails(response.data.user);
        setCompanyRole(response.data.user?.companyRole);
      }
    } catch (exception) {
    } finally {
      setLoading(false);
    }
  };

  const getAllProgrammeAnalyticsStatsParamsWithoutTimeRange = () => {
    return {
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
    if (companyRole === 'ProgrammeDeveloper') {
      return {
        stats: [
          {
            type: 'MY_AGG_PROGRAMME_BY_STATUS',
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
    } else if (companyRole === 'Certifier' && categoryType === 'mine') {
      return {
        stats: [
          {
            type: 'CERTIFIED_BY_ME_BY_STATE',
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
    } else if (companyRole === 'Certifier' && categoryType === 'overall') {
      return {
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
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
        stats: [
          {
            type: 'AGG_PROGRAMME_BY_STATUS',
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
    if (companyRole === 'ProgrammeDeveloper') {
      return {
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
    } else if (companyRole === 'Certifier' && categoryType === 'mine') {
      return {
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
    } else if (companyRole === 'Certifier' && categoryType === 'overall') {
      return {
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
    setLoading(true);
    try {
      const response: any = await post('stats/programme/agg', getAllChartsParams());
      let programmesAggByStatus: any;
      let programmesAggBySector: any;
      let totalCreditsCertifiedStats: any;
      let programmeLocationsStats: any;
      let transferLocationsStats: any;
      if (companyRole === 'ProgrammeDeveloper') {
        programmesAggByStatus = response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.data;
        programmesAggBySector = response?.data?.stats?.MY_AGG_PROGRAMME_BY_SECTOR?.data;
        totalCreditsCertifiedStats = response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
        transferLocationsStats = response?.data?.stats?.MY_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.MY_PROGRAMME_LOCATION;
      } else if (companyRole === 'Certifier' && categoryType === 'mine') {
        programmesAggByStatus = response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.data;
        programmesAggBySector = response?.data?.stats?.CERTIFIED_BY_ME_BY_SECTOR?.data;
        totalCreditsCertifiedStats = response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
        transferLocationsStats = response?.data?.stats?.MY_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.MY_PROGRAMME_LOCATION;
      } else if (companyRole === 'Certifier' && categoryType === 'overall') {
        programmesAggByStatus = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        programmesAggBySector = response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.data;
        totalCreditsCertifiedStats = response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
        transferLocationsStats = response?.data?.stats?.ALL_TRANSFER_LOCATION?.data;
        programmeLocationsStats = response?.data?.stats?.ALL_PROGRAMME_LOCATION;
      } else {
        programmesAggByStatus = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        programmesAggBySector = response?.data?.stats?.AGG_PROGRAMME_BY_SECTOR?.data;
        totalCreditsCertifiedStats = response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
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
          progarmmesSectorSeriesData.push({
            name: sector,
            data: programmesAggBySector[firstLower(sector)],
          });
        });
        //   {
        //     name: 'Energy',
        //     data: programmesAggBySector?.energy,
        //   },
        //   {
        //     name: 'Health',
        //     data: programmesAggBySector?.health,
        //   },
        //   {
        //     name: 'Education',
        //     data: programmesAggBySector?.education,
        //   },
        //   {
        //     name: 'Transport',
        //     data: programmesAggBySector?.transport,
        //   },
        //   {
        //     name: 'Manufacturing',
        //     data: programmesAggBySector?.manufacturing,
        //   },
        //   {
        //     name: 'Hospitality',
        //     data: programmesAggBySector?.hospitality,
        //   },
        //   {
        //     name: 'Forestry',
        //     data: programmesAggBySector?.forestry,
        //   },
        //   {
        //     name: 'Waste',
        //     data: programmesAggBySector?.waste,
        //   },
        //   {
        //     name: 'Agriculture',
        //     data: programmesAggBySector?.agriculture,
        //   },
        //   {
        //     name: 'Other',
        //     data: programmesAggBySector?.other,
        //   },
        // ];
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
      setLoading(false);
    }
  };

  const getAllProgrammeAnalyticsStatsWithoutTimeRange = async () => {
    setLoadingWithoutTimeRange(true);
    try {
      const response: any = await post(
        'stats/programme/agg',
        getAllProgrammeAnalyticsStatsParamsWithoutTimeRange()
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
      const programmeByStatusAggregationResponseLastUpdate =
        response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.last;
      programmeByStatusAggregationResponse?.map((responseItem: any, index: any) => {
        if (responseItem?.currentStage === 'AwaitingAuthorization') {
          setPendingProjectsWithoutTimeRange(parseInt(responseItem?.count));
        }
      });
      if (programmeByStatusAggregationResponseLastUpdate) {
        setLastUpdateProgrammesStats(programmeByStatusAggregationResponseLastUpdate);
      }
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
        getAllProgrammeAnalyticsStatsParams()
      );
      let programmeByStatusAggregationResponse: any;
      let certifiedRevokedAggregationResponse: any;
      if (companyRole === 'ProgrammeDeveloper') {
        programmeByStatusAggregationResponse =
          response?.data?.stats?.MY_AGG_PROGRAMME_BY_STATUS?.data;
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
      } else if (companyRole === 'Certifier' && categoryType === 'mine') {
        programmeByStatusAggregationResponse =
          response?.data?.stats?.CERTIFIED_BY_ME_BY_STATE?.data;
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.MY_CERTIFIED_REVOKED_PROGRAMMES?.data;
      } else if (companyRole === 'Certifier' && categoryType === 'overall') {
        programmeByStatusAggregationResponse = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
      } else {
        programmeByStatusAggregationResponse = response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
        certifiedRevokedAggregationResponse =
          response?.data?.stats?.CERTIFIED_REVOKED_PROGRAMMES?.data;
      }
      let totalProgrammes = 0;
      let totalEstCredits = 0;
      let totalIssuedCredits = 0;
      let totalRetiredCredits = 0;
      let totalBalancecredit = 0;
      let totalTxCredits = 0;
      let totalCertifiedCredit = 0;
      let totalUnCertifiedredit = 0;
      let totalRevokedCredits = 0;
      if (programmeByStatusAggregationResponse?.length > 0) {
        programmeByStatusAggregationResponse?.map((responseItem: any, index: any) => {
          if (responseItem?.currentStage === 'AwaitingAuthorization') {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
            totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
            totalRetiredCredits =
              totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
            totalBalancecredit = totalBalancecredit + parseFloat(responseItem?.totalbalancecredit);
            totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
            setPendingProjects(parseInt(responseItem?.count));
          }
          if (responseItem?.currentStage === 'Rejected') {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
            totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
            totalRetiredCredits =
              totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
            totalBalancecredit = totalBalancecredit + parseFloat(responseItem?.totalbalancecredit);
            totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
            setRejectedProjects(parseInt(responseItem?.count));
          }
          if (responseItem?.currentStage === 'Authorised') {
            totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
            totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
            totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
            totalRetiredCredits =
              totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
            totalBalancecredit = totalBalancecredit + parseFloat(responseItem?.totalbalancecredit);
            totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
            setAuthorisedProjects(parseInt(responseItem?.count));
          }
        });
        setTotalProjects(totalProgrammes);
      } else {
        setPendingProjects(0);
        setAuthorisedProjects(0);
        setRejectedProjects(0);
        setTotalProjects(0);
      }
      if (certifiedRevokedAggregationResponse) {
        totalCertifiedCredit = parseFloat(certifiedRevokedAggregationResponse?.certifiedSum);
        totalUnCertifiedredit = parseFloat(certifiedRevokedAggregationResponse?.uncertifiedSum);
        totalRevokedCredits = parseFloat(certifiedRevokedAggregationResponse?.revokedSum);
      }
      setCreditBalance(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      const creditAuthorized = totalEstCredits - totalIssuedCredits;
      pieSeriesCreditsData.push(creditAuthorized);
      pieSeriesCreditsData.push(totalBalancecredit);
      pieSeriesCreditsData.push(totalTxCredits);
      pieSeriesCreditsData.push(totalRetiredCredits);

      pieSeriesCreditsCerifiedData.push(totalCertifiedCredit);
      pieSeriesCreditsCerifiedData.push(totalUnCertifiedredit);
      pieSeriesCreditsCerifiedData.push(totalRevokedCredits);
      const totalCreditsCertified =
        totalCertifiedCredit + totalUnCertifiedredit + totalRevokedCredits;
      optionDonutPieA.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + String(addCommSep(totalEstCredits)) !== 'NaN' ? addCommSep(totalEstCredits) : 0;
      optionDonutPieB.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + addCommSep(totalCreditsCertified);
      setCreditPieSeries(pieSeriesCreditsData);
      setCreditCertifiedPieSeries(pieSeriesCreditsCerifiedData);
      setLastUpdate(response?.data?.lastUpdate);
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
    getUserProfileDetails();
  }, []);

  useEffect(() => {
    getAllProgrammeAnalyticsStatsWithoutTimeRange();
    if (companyRole === 'ProgrammeDeveloper') {
      setCategoryType('mine');
    }
  }, [companyRole]);

  useEffect(() => {
    getAllProgrammeAnalyticsStats();
    getAllProgrammesAggChartStats();
  }, [startTime, endTime, categoryType, companyRole]);

  useEffect(() => {
    ApexCharts.exec('total-programmes-sector', 'updateSeries', {
      series: totalProgrammesSectorSeries,
    });
  }, [totalProgrammesSectorSeries]);

  useEffect(() => {
    ApexCharts.exec('total-programmes', 'updateSeries', {
      series: totalProgrammesSeries,
    });
  }, [totalProgrammesSeries]);

  useEffect(() => {
    ApexCharts.exec('total-credits', 'updateSeries', {
      series: totalCreditsSeries,
    });
  }, [totalCreditsSeries]);

  useEffect(() => {
    ApexCharts.exec('total-credits-certified', 'updateSeries', {
      series: totalCertifiedCreditsSeries,
    });
  }, [totalCertifiedCreditsSeries]);

  const countS = ['all', ['>=', ['get', 'count'], 0]];
  const pending = ['==', ['get', 'stage'], 'AwaitingAuthorization'];
  const authorised = ['==', ['get', 'stage'], 'Authorised'];
  const rejected = ['==', ['get', 'stage'], 'Rejected'];

  // colors to use for the categories
  // const colors = ['#33adff', '#4db8ff', '#80ccff', '#99d6ff', '#ccebff'];
  const colors = ['#6ACDFF', '#FF8183', '#CDCDCD'];

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
    console.log('properties of donut creator --- > ', properties);
    const offsets = [];
    const offsetsStage = [];
    let counts: any = [];
    let programmeStageCounts: any = [];
    if (properties.count) {
      counts = [properties.count];
    }

    if (properties.cluster_id) {
      programmeStageCounts = [properties.authorised, properties.pending, properties.rejected];
    } else {
      if (properties?.stage === 'AwaitingAuthorization') {
        programmeStageCounts = [0, properties.count, 0];
      } else if (properties?.stage === 'Authorised') {
        programmeStageCounts = [properties.count, 0, 0];
      } else if (properties?.stage === 'Rejected') {
        programmeStageCounts = [0, 0, properties.count];
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
  }

  useEffect(() => {
    setTimeout(() => {
      if (mapContainerInternationalRef?.current) {
        const map = new mapboxgl.Map({
          container: mapContainerInternationalRef?.current || '',
          // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [12, 50],
          zoom: 0.5,
        });

        // Add markers to the map.
        map.on('load', () => {
          map.addSource('countries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1',
          });

          // Build a GL match expression that defines the color for every vector tile feature
          // Use the ISO 3166-1 alpha 3 code as the lookup key for the country shape
          const matchExpression: any = ['match', ['get', 'iso_3166_1']];
          const txLocationMap: any = {};

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

          function getCountryCodes(dataSet: any) {
            return dataSet.map((item: any) => item.code);
          }

          map.on('click', function (e) {
            const features = map.queryRenderedFeatures(e.point, { layers: ['countries-join'] });
            if (!features.length) {
              return;
            }

            const feature = features[0];
            if (!txLocationMap[feature.properties?.iso_3166_1]) {
              return;
            }
            console.log(feature);

            const popup = new mapboxgl.Popup()
              .setLngLat(map.unproject(e.point))
              .setHTML(
                `${feature.properties?.name_en} : ${txLocationMap[feature.properties?.iso_3166_1]}`
              )
              .addTo(map);
          });

          // Use the same approach as above to indicate that the symbols are clickable
          // by changing the cursor style to 'pointer'.
          map.on('mousemove', function (e) {
            const features = map.queryRenderedFeatures(e.point, { layers: ['countries-join'] });
            map.getCanvas().style.cursor =
              features.length > 0 && txLocationMap[features[0].properties?.iso_3166_1]
                ? 'pointer'
                : '';
          });

          // Last value is the default, used where there is no data
          matchExpression.push('rgba(0, 0, 0, 0)');

          map.addLayer(
            {
              id: 'countries-join',
              type: 'fill',
              source: 'countries',
              'source-layer': 'country_boundaries',
              paint: {
                'fill-color': matchExpression,
              },
            },
            'admin-1-boundary-bg'
          );
        });
      }
    }, 1000);
  }, [programmeTransferLocations]);

  useEffect(() => {
    setTimeout(() => {
      if (mapContainerRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef?.current || '',
          zoom: 4,
          center: programmeLocations?.features[0]?.geometry?.coordinates
            ? programmeLocations?.features[0]?.geometry?.coordinates
            : [7.4924165, 5.5324032],
          // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
          style: 'mapbox://styles/mapbox/light-v11',
        });
        map.on('load', () => {
          // add a clustered GeoJSON source for a sample set of programmeLocations
          map.addSource('programmeLocations', {
            type: 'geojson',
            data: programmeLocations,
            cluster: true,
            clusterRadius: 40,
            clusterProperties: {
              // keep separate counts for each countnitude category in a cluster
              count: ['+', ['case', countS, ['get', 'count'], 0]],
              pending: ['+', ['case', pending, ['get', 'count'], 0]],
              authorised: ['+', ['case', authorised, ['get', 'count'], 0]],
              rejected: ['+', ['case', rejected, ['get', 'count'], 0]],
            },
          });
          // circle and symbol layers for rendering individual programmeLocations (unclustered points)
          map.addLayer({
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

          // objects for caching and keeping track of HTML marker objects (for performance)
          const markers: any = {};
          let markersOnScreen: any = {};

          function updateMarkers() {
            const newMarkers: any = {};
            const features: any = map.querySourceFeatures('programmeLocations');

            // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
            // and add it to the map if it's not there already
            for (const feature of features) {
              console.log(feature.properties);
              const coords = feature.geometry.coordinates;
              const properties = feature.properties;
              // if (!properties.cluster) continue;
              const id = properties.cluster_id ? properties.cluster_id : Number(properties.id);

              let marker: any = markers[id];
              if (!marker) {
                const el: any = createDonutChart(properties);
                marker = markers[id] = new mapboxgl.Marker({
                  element: el,
                }).setLngLat(coords);

                // marker = markers[id] = new mapboxgl.Marker({
                //   element: el,
                // }).;
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
            if (!map.isSourceLoaded('programmeLocations')) return;
            updateMarkers();
          });
        });
      }
    }, 1000);
  }, [programmeLocations]);

  const onChangeCategory = (event: any) => {
    setCategoryType(event?.target?.value);
  };

  return (
    <div className="dashboard-main-container">
      <div className="stastics-cards-container">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                companyRole === 'Government'
                  ? pendingProjectsWithoutTimeRange
                  : companyRole === 'ProgrammeDeveloper'
                  ? transferRequestReceived
                  : programmesUnCertifed
              }
              title={
                companyRole === 'Government'
                  ? 'Programmes Pending'
                  : companyRole === 'ProgrammeDeveloper'
                  ? 'Transfer Requests Received'
                  : 'Programmes Uncertified'
              }
              updatedDate={parseInt(lastUpdateProgrammesStats) / 1000}
              icon={
                companyRole === 'Government' ? (
                  <ClockHistory color="#16B1FF" size={80} />
                ) : companyRole === 'ProgrammeDeveloper' ? (
                  <BoxArrowInRight color="#16B1FF" size={80} />
                ) : (
                  <ShieldX color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                companyRole === 'Government'
                  ? transferRequestSent
                  : companyRole === 'ProgrammeDeveloper'
                  ? transferRequestSent
                  : programmesCertifed
              }
              title={
                companyRole === 'Government'
                  ? 'Transfer Requests Sent'
                  : companyRole === 'ProgrammeDeveloper'
                  ? 'Transfer Requests Sent'
                  : 'Programmes Certified'
              }
              updatedDate={lastUpdate}
              icon={
                companyRole === 'Government' ? (
                  <BoxArrowRight color="#16B1FF" size={80} />
                ) : companyRole === 'ProgrammeDeveloper' ? (
                  <BoxArrowRight color="#16B1FF" size={80} />
                ) : (
                  <ShieldCheck color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <StasticCard
              value={
                companyRole === 'Government'
                  ? creditBalanceWithoutTimeRange
                  : companyRole === 'ProgrammeDeveloper'
                  ? creditBalanceWithoutTimeRange
                  : creditCertiedBalanceWithoutTimeRange
              }
              title={
                companyRole === 'Government'
                  ? 'Credit Balance'
                  : companyRole === 'ProgrammeDeveloper'
                  ? 'Credit Balance'
                  : 'Credit Certified'
              }
              updatedDate={lastUpdate}
              icon={
                companyRole === 'Government' ? (
                  <Gem color="#16B1FF" size={80} />
                ) : companyRole === 'ProgrammeDeveloper' ? (
                  <Gem color="#16B1FF" size={80} />
                ) : (
                  <ShieldExclamation color="#16B1FF" size={80} />
                )
              }
              loading={loadingWithoutTimeRange}
            />
          </Col>
        </Row>
      </div>
      <div className="filter-container">
        <div className="date-filter">
          <RangePicker
            ranges={{
              Today: [moment(), moment()],
              'Last 7 days': [moment().subtract('7', 'days'), moment()],
              'Last 14 days': [moment().subtract('14', 'days'), moment()],
            }}
            showTime
            allowClear={true}
            format="DD:MM:YYYY"
            onChange={onChangeRange}
          />
        </div>
        <div className="radio-selection">
          {companyRole === 'Certifier' && (
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
            <ProgrammeRejectAndTransfer
              totalPrgrammes={totalProjects}
              pending={pendingProjects}
              rejected={rejectedProjects}
              authorized={authorisedProjects}
              updatedDate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <PieChartsStat
              title="Credits"
              options={optionDonutPieA}
              series={creditsPieSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <PieChartsStat
              title="Certified Credits"
              options={optionDonutPieB}
              series={creditsCertifiedPieSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              id="total-programmes"
              title="Total Programmes"
              options={totalProgrammesOptions}
              series={totalProgrammesSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              id="total-programmes-sector"
              title="Total Programmes: Sector"
              options={totalProgrammesOptionsSub}
              series={totalProgrammesSectorSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              id="total-credits"
              title="Total Credits"
              options={totalCreditsOptions}
              series={totalCreditsSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              id="total-credits-certified"
              title="Total Credits Certified"
              options={totalCreditsCertifiedOptions}
              series={totalCertifiedCreditsSeries}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
        </Row>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <div className="stastics-and-pie-card height-map-rem">
              <div className="pie-charts-title">Programme Locations</div>
              {loading ? (
                <div className="margin-top-2">
                  <Skeleton active />
                  <Skeleton active />
                </div>
              ) : (
                <>
                  <div className="map-content">
                    <div className="map-container" ref={mapContainerRef} />
                  </div>
                  <div className="stage-legends">
                    <LegendItem text="Authorised" color="#6ACDFF" />
                    <LegendItem text="Pending" color="#FF8183" />
                    <LegendItem text="Rejected" color="#CDCDCD" />
                  </div>
                  <div className="updated-on margin-top-1">
                    <div className="updated-moment-container">
                      {moment(parseInt(lastUpdateProgrammesStats)).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
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
                  <div className="updated-on margin-top-1">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;
