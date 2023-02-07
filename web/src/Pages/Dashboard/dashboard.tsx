import React, { useEffect, useRef, useState } from 'react';
import { Col, DatePicker, Progress, Radio, Row, Skeleton, message } from 'antd';
import Chart from 'react-apexcharts';
import ReactMapboxGl, { Layer, Feature } from 'react-mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapCard from '../../Components/MapCards.tsx/MapCard';
import StasticCard from '../../Components/StasticCard/StasticCard';
import './dashboard.scss';
import {
  optionDonutPieA,
  optionDonutPieB,
  seriesY,
  totalCreditsCertifiedOptions,
  totalCreditsOptions,
  totalProgrammesOptions,
  totalProgrammesOptionsSub,
} from './DUMMY_DATAS';
import ProgrammeRejectAndTransfer from './ProgrammeRejectAndTransfer';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import mapboxgl from 'mapbox-gl';
import Geocoding from '@mapbox/mapbox-sdk/services/geocoding';
import { addCommSep } from '../../Definitions/InterfacesAndType/programme.definitions';
import {
  ClockHistory,
  BoxArrowInRight,
  ShieldX,
  ShieldExclamation,
  BoxArrowRight,
  ShieldCheck,
  Gem,
  BoxArrowInLeft,
} from 'react-bootstrap-icons';
import PieChartsStat from './pieChartStat';
import BarChartsStat from './barChartStats';
import TransferLocationsMap from './transferLocations';

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
  const [estimatedCredits, setEstimatedCredits] = useState<number>();

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [categoryType, setCategoryType] = useState<string>('overall');

  const [issuedProgrammes, setIssuedProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [rejectedProgrammes, setRejectedProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [pendingProgrammes, setPendingProgrammes] = useState<number[]>([0, 0, 0, 0]);

  // states for totalProgrammes sub sector chart
  const [energyProgrammes, setEnergyProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [healthProgrammes, setHealthProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [educationProgrammes, setEducationProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [transportProgrammes, setTransportProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [manufacturingProgrammes, setManufacturingProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [hospitalityProgrammes, setHospitalityProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [forestryProgrammes, setForestryProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [wasteProgrammes, setWasteProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [agricultureProgrammes, setAgricultureProgrammes] = useState<number[]>([0, 0, 0, 0]);
  const [otherProgrammes, setOtherProgrammes] = useState<number[]>([0, 0, 0, 0]);

  // states for totalCredits chart
  const [authorizedCredits, setAuthorizedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [issuedCredits, setIssuedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [retiredCredits, setRetiredCredits] = useState<number[]>([0, 0, 0, 0]);
  const [transferredCredits, setTransferredCredits] = useState<number[]>([0, 0, 0, 0]);

  // states for totalCreditsCertified chart
  const [certifiedCredits, setCertifiedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [unCertifiedCredits, setUnCertifiedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [revokedCredits, setRevokedCredits] = useState<number[]>([0, 0, 0, 0]);

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
  const startOfTheYear = Date.parse(String(moment(currentYear).startOf('year')));
  const endOfTheYear = Date.parse(String(moment(currentYear).endOf('year')));
  console.log({ currentYear, startOfTheYear, endOfTheYear });

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
          type: 'CERTIFIED_BY_ME',
        },
      ],
      category: 'overall',
    };
  };

  const getAllProgrammeAnalyticsStatsParams = () => {
    return {
      stats: [
        {
          type: 'AGG_PROGRAMME_BY_STATUS',
        },
        // {
        //   type: 'PROGRAMS_BY_STATUS',
        //   value: 'AWAITING_AUTHORIZATION',
        // },
        // {
        //   type: 'PROGRAMS_BY_STATUS',
        //   value: 'AUTHORISED',
        // },
        // {
        //   type: 'PROGRAMS_BY_STATUS',
        //   value: 'REJECTED',
        // },
        // {
        //   type: 'TRANSFER_REQUEST',
        // },
        // {
        //   type: 'CREDIT_STATS_BALANCE',
        // },
        // {
        //   type: 'CREDIT_STATS_TRANSFERRED',
        // },
        // {
        //   type: 'CREDIT_STATS_RETIRED',
        // },
        // {
        //   type: 'CREDIT_STATS_ISSUED',
        // },
        // {
        //   type: 'CREDIT_STATS_ESTIMATED',
        // },
        // {
        //   type: 'CREDIT_CERTIFIED',
        // },
        // {
        //   type: 'CREDIT_UNCERTIFIED',
        // },
        // {
        //   type: 'CREDIT_REVOKED',
        // },
      ],
      category: companyRole === 'ProgrammeDeveloper' ? 'mine' : categoryType,
      startTime: startTime !== 0 ? startTime : startOfTheYear,
      endTime: endTime !== 0 ? endTime : endOfTheYear,
    };
  };

  const getAllProgrammeAnalyticsStatsChartsParams = () => {
    return {
      stats: [
        {
          type: 'TOTAL_PROGRAMS',
        },
        {
          type: 'TOTAL_PROGRAMS_SECTOR',
        },
        {
          type: 'TOTAL_CREDITS',
        },
        {
          type: 'TOTAL_CREDITS_CERTIFIED',
        },
        {
          type: 'PROGRAMME_LOCATIONS',
        },
        {
          type: 'TRANSFER_LOCATIONS',
        },
      ],
      category: companyRole === 'ProgrammeDeveloper' ? 'mine' : categoryType,
      startTime: startTime !== 0 ? startTime : startOfTheYear,
      endTime: endTime !== 0 ? endTime : endOfTheYear,
    };
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

  const getAllProgrammeAnalyticsStatsCharts = async () => {
    setLoading(true);
    try {
      const pendingProgrames: any = [];
      const issuedProgrames: any = [];
      const rejectedProgrames: any = [];
      const timeLabelsProgrames: any = [];

      const energyProgrames: any = [];
      const healthProgrames: any = [];
      const educationProgrames: any = [];
      const transportProgrames: any = [];
      const manufacturingProgrames: any = [];
      const hospitalityProgrames: any = [];
      const forestryProgrames: any = [];
      const wasteProgrames: any = [];
      const agricultureProgrames: any = [];
      const otherProgrames: any = [];

      const authorizedCredit: any = [];
      const issuedCredit: any = [];
      const retiredCredit: any = [];
      const transferredCredit: any = [];

      const certifiedCredit: any = [];
      const unCertifiedCredit: any = [];
      const revokedCredit: any = [];

      const response: any = await post(
        'stats/programme/dashboardCharts',
        getAllProgrammeAnalyticsStatsChartsParams()
      );
      console.log(response?.data?.stats);
      if (response?.data?.stats?.TOTAL_PROGRAMS) {
        const totalProgrammes = response?.data?.stats?.TOTAL_PROGRAMS;
        if (totalProgrammes?.awaitingAuthorization) {
          const pendings = totalProgrammes?.awaitingAuthorization;
          pendings?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            const label = Object.getOwnPropertyNames(item);
            const date = new Date(parseInt(label[0]));
            const formattedDate = moment(date).format('DD-MM-YYYY');
            pendingProgrames.push(programesCount[0]);
            timeLabelsProgrames.push(formattedDate);
          });
        }
        if (totalProgrammes?.issued) {
          const issued = totalProgrammes?.issued;
          issued?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            issuedProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammes?.rejected) {
          const rejected = totalProgrammes?.rejected;
          rejected?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            rejectedProgrames.push(programesCount[0]);
          });
        }
      }
      if (response?.data?.stats?.TOTAL_PROGRAMS_SECTOR) {
        const totalProgrammesSector = response?.data?.stats?.TOTAL_PROGRAMS_SECTOR;
        if (totalProgrammesSector?.agriculture) {
          const agriculture = totalProgrammesSector?.agriculture;
          agriculture?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            agricultureProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.education) {
          const education = totalProgrammesSector?.education;
          education?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            educationProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.energy) {
          const energy = totalProgrammesSector?.energy;
          energy?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            energyProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.forestry) {
          const forestry = totalProgrammesSector?.forestry;
          forestry?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            forestryProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.health) {
          const health = totalProgrammesSector?.health;
          health?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            healthProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.hospitality) {
          const hospitality = totalProgrammesSector?.hospitality;
          hospitality?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            hospitalityProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.manufacturing) {
          const manufacturing = totalProgrammesSector?.manufacturing;
          manufacturing?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            manufacturingProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.other) {
          const other = totalProgrammesSector?.other;
          other?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            otherProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.transport) {
          const transport = totalProgrammesSector?.transport;
          transport?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            transportProgrames.push(programesCount[0]);
          });
        }
        if (totalProgrammesSector?.waste) {
          const waste = totalProgrammesSector?.waste;
          waste?.map((item: any, index: any) => {
            const programesCount = Object.values(item);
            wasteProgrames.push(programesCount[0]);
          });
        }
      }
      if (response?.data?.stats?.TOTAL_CREDITS) {
        const totalCredits = response?.data?.stats?.TOTAL_CREDITS;
        if (totalCredits?.authorized) {
          const authorized = totalCredits?.authorized;
          authorized?.map((item: any, index: any) => {
            const credit = Object.values(item);
            authorizedCredit.push(credit[0]);
          });
        }
        if (totalCredits?.issued) {
          const issued = totalCredits?.issued;
          issued?.map((item: any, index: any) => {
            const credit = Object.values(item);
            issuedCredit.push(credit[0]);
          });
        }
        if (totalCredits?.retired) {
          const retired = totalCredits?.retired;
          retired?.map((item: any, index: any) => {
            const credit = Object.values(item);
            retiredCredit.push(credit[0]);
          });
        }
        if (totalCredits?.transferred) {
          const transferred = totalCredits?.transferred;
          transferred?.map((item: any, index: any) => {
            const credit = Object.values(item);
            transferredCredit.push(credit[0]);
          });
        }
      }
      if (response?.data?.stats?.PROGRAMME_LOCATIONS) {
        const locations = response?.data?.stats?.PROGRAMME_LOCATIONS;
        setProgrammeLocations(locations);
      }
      if (response?.data?.stats?.TRANSFER_LOCATIONS) {
        const locations = response?.data?.stats?.TRANSFER_LOCATIONS;
        setProgrammeTransferLocations(locations);
      }
      if (response?.data?.stats?.TOTAL_CREDITS_CERTIFIED) {
        const totalCredits = response?.data?.stats?.TOTAL_CREDITS_CERTIFIED;
        if (totalCredits?.certified) {
          const certified = totalCredits?.certified;
          certified?.map((item: any, index: any) => {
            const credit = Object.values(item);
            certifiedCredit.push(credit[0]);
          });
        }
        if (totalCredits?.uncertified) {
          const uncertified = totalCredits?.uncertified;
          uncertified?.map((item: any, index: any) => {
            const credit = Object.values(item);
            unCertifiedCredit.push(credit[0]);
          });
        }
        if (totalCredits?.revoked) {
          const revoked = totalCredits?.revoked;
          revoked?.map((item: any, index: any) => {
            const credit = Object.values(item);
            revokedCredit.push(credit[0]);
          });
        }
      }
      console.log({ pendingProgrames, issuedProgrames, rejectedProgrames, timeLabelsProgrames });
      setPendingProgrammes(pendingProgrames);
      setIssuedProgrammes(issuedProgrames);
      setRejectedProgrammes(rejectedProgrames);

      setEnergyProgrammes(energyProgrames);
      setHealthProgrammes(healthProgrames);
      setEducationProgrammes(educationProgrames);
      setTransportProgrammes(transportProgrames);
      setManufacturingProgrammes(manufacturingProgrames);
      setHospitalityProgrammes(hospitalityProgrames);
      setForestryProgrammes(forestryProgrames);
      setWasteProgrammes(wasteProgrames);
      setAgricultureProgrammes(agricultureProgrames);
      setOtherProgrammes(otherProgrames);

      setAuthorizedCredits(authorizedCredit);
      setIssuedCredits(issuedCredit);
      setRetiredCredits(retiredCredit);
      setTransferredCredits(transferredCredit);
      setCertifiedCredits(certifiedCredit);
      setUnCertifiedCredits(unCertifiedCredit);
      setRevokedCredits(revokedCredit);
      totalProgrammesOptions.xaxis.categories = timeLabelsProgrames;
      totalProgrammesOptionsSub.xaxis.categories = timeLabelsProgrames;
      totalCreditsOptions.xaxis.categories = timeLabelsProgrames;
      totalCreditsCertifiedOptions.xaxis.categories = timeLabelsProgrames;
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
      console.log('stats data  -- > ', response?.data);
      const programmeByStatusAggregationResponse =
        response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
      const pendingTransferInitAggregationResponse =
        response?.data?.stats?.PENDING_TRANSFER_INIT?.data;
      const pendingTransferReceivedAggregationResponse =
        response?.data?.stats?.PENDING_TRANSFER_RECV?.data;
      const myCreditAggregationResponse = response?.data?.stats?.MY_CREDIT?.data;
      const certifiedByMeAggregationResponse = response?.data?.stats?.CERTIFIED_BY_ME?.data;
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
        setProgrammesCertifed(parseInt(certifiedByMeAggregationResponse?.certifiedCount));
        setProgrammesUnCertifed(parseInt(certifiedByMeAggregationResponse?.uncertifiedCount));
        setCreditCertifiedBalanceWithoutTimeRange(
          parseInt(certifiedByMeAggregationResponse?.certifiedSum)
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
        getAllProgrammeAnalyticsStatsParams()
      );
      console.log('stats data 2nd  -- > ', response?.data);
      const programmeByStatusAggregationResponse =
        response?.data?.stats?.AGG_PROGRAMME_BY_STATUS?.data;
      let totalProgrammes = 0;
      let totalEstCredits = 0;
      let totalIssuedCredits = 0;
      let totalRetiredCredits = 0;
      let totalTxCredits = 0;
      programmeByStatusAggregationResponse?.map((responseItem: any, index: any) => {
        if (responseItem?.currentStage === 'AwaitingAuthorization') {
          setPendingProjects(parseInt(responseItem?.count));
          totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
          totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
          totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
          totalRetiredCredits = totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
          totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
        }
        if (responseItem?.currentStage === 'Rejected') {
          setRejectedProjects(parseInt(responseItem?.count));
          totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
          totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
          totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
          totalRetiredCredits = totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
          totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
        }
        if (responseItem?.currentStage === 'Authorised') {
          setAuthorisedProjects(parseInt(responseItem?.count));
          totalProgrammes = totalProgrammes + parseInt(responseItem?.count);
          totalEstCredits = totalEstCredits + parseFloat(responseItem?.totalestcredit);
          totalIssuedCredits = totalIssuedCredits + parseFloat(responseItem?.totalissuedcredit);
          totalRetiredCredits = totalRetiredCredits + parseFloat(responseItem?.totalretiredcredit);
          totalTxCredits = totalTxCredits + parseFloat(responseItem?.totaltxcredit);
        }
      });
      setTotalProjects(totalProgrammes);
      // setPendingProjects(response?.data?.stats?.AWAITING_AUTHORIZATION);
      // setRejectedProjects(response?.data?.stats?.REJECTED);
      // setAuthorisedProjects(response?.data?.stats?.AUTHORISED);
      // setTransfererequestsSent(response?.data?.stats?.TRANSFER_REQUEST);
      setCreditBalance(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      const creditAuthorized = totalEstCredits - totalIssuedCredits;
      pieSeriesCreditsData.push(creditAuthorized);
      pieSeriesCreditsData.push(totalTxCredits);
      pieSeriesCreditsData.push(totalRetiredCredits);
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));

      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_CERTIFIED?.sum));
      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_UNCERTIFIED?.sum));
      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_REVOKED?.sum));
      // pieSeriesCreditsCerifiedData.push(
      //   parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_ISSUED?.sum)
      // );
      // let totalCredits = 0;
      // console.log(
      //   'estimated value || total credits -- > ',
      //   response?.data?.stats?.CREDIT_STATS_ESTIMATED?.sum === null
      // );
      // if (response?.data?.stats?.CREDIT_STATS_ESTIMATED?.sum !== null) {
      //   totalCredits = response?.data?.stats?.CREDIT_STATS_ESTIMATED?.sum;
      // } else {
      //   totalCredits = 0;
      // }
      let totalCreditsCertified = 0;
      for (let i = 0; i < pieSeriesCreditsData.length; i++) {
        if (String(pieSeriesCreditsData[i]) === 'NaN') {
          if (i !== -1) {
            pieSeriesCreditsData[i] = 0;
          }
          // totalCredits = totalCredits + 0;
        } else {
          // totalCredits = totalCredits + pieSeriesCreditsData[i];
        }
      }
      for (let j = 0; j < pieSeriesCreditsCerifiedData.length; j++) {
        if (String(pieSeriesCreditsCerifiedData[j]) === 'NaN') {
          if (j !== -1) {
            pieSeriesCreditsCerifiedData[j] = 0;
          }
          totalCreditsCertified = totalCreditsCertified + 0;
        } else {
          totalCreditsCertified = totalCreditsCertified + pieSeriesCreditsCerifiedData[j];
        }
      }

      optionDonutPieA.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + String(addCommSep(totalEstCredits)) !== 'NaN' ? addCommSep(totalEstCredits) : 0;
      optionDonutPieB.plotOptions.pie.donut.labels.total.formatter = () =>
        '' + addCommSep(totalCreditsCertified);

      console.log({ pieSeriesCreditsData, pieSeriesCreditsCerifiedData });
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
      console.log('sdkfjhkahf ewiufhwiefhuf ******** ');
      setCategoryType('mine');
    }
  }, [companyRole]);

  useEffect(() => {
    getAllProgrammeAnalyticsStats();
    getAllProgrammeAnalyticsStatsCharts();
  }, [startTime, endTime, categoryType]);

  const seriesTotalProgrammesY = [
    {
      name: 'Authorised',
      data: issuedProgrammes,
    },
    {
      name: 'Rejected',
      data: rejectedProgrammes,
    },
    {
      name: 'Pending',
      data: pendingProgrammes,
    },
  ];

  const seriesTotalProgrammesSubY = [
    {
      name: 'Energy',
      data: energyProgrammes,
    },
    {
      name: 'Health',
      data: healthProgrammes,
    },
    {
      name: 'Education',
      data: educationProgrammes,
    },
    {
      name: 'Transport',
      data: transportProgrammes,
    },
    {
      name: 'Manufacturing',
      data: manufacturingProgrammes,
    },
    {
      name: 'Hospitality',
      data: hospitalityProgrammes,
    },
    {
      name: 'Forestry',
      data: forestryProgrammes,
    },
    {
      name: 'Waste',
      data: wasteProgrammes,
    },
    {
      name: 'Agriculture',
      data: agricultureProgrammes,
    },
    {
      name: 'Other',
      data: otherProgrammes,
    },
  ];

  const seriesTotalCreditsY = [
    {
      name: 'Authorised',
      data: authorizedCredits,
    },
    {
      name: 'Issued',
      data: issuedCredits,
    },
    {
      name: 'Retired',
      data: retiredCredits,
    },
    {
      name: 'Transferred',
      data: transferredCredits,
    },
  ];

  const seriesTotalCreditsCertifiedY = [
    {
      name: 'Certified',
      data: certifiedCredits,
    },
    {
      name: 'UnCertified',
      data: unCertifiedCredits,
    },
    {
      name: 'Revoked',
      data: revokedCredits,
    },
  ];

  useEffect(() => {
    console.log('transfr credit --- > ', transferredCredits);
  }, [transferredCredits]);

  const count1 = ['all', ['>=', ['get', 'count'], 0], ['<', ['get', 'count'], 4]];
  const count2 = ['all', ['>=', ['get', 'count'], 4], ['<', ['get', 'count'], 6]];
  const count3 = ['all', ['>=', ['get', 'count'], 6], ['<', ['get', 'count'], 10]];
  const count4 = ['all', ['>=', ['get', 'count'], 10], ['<', ['get', 'count'], 16]];
  const count5 = ['>=', ['get', 'count'], 16];

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
    console.log('properties of donut creator --- > ', properties);
    const offsets = [];
    let counts: any = [];
    if (properties.count1) {
      counts = [
        properties.count1,
        properties.count2,
        properties.count3,
        properties.count4,
        properties.count5,
      ];
    } else {
      counts = [properties.count];
    }
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
      html += donutSegment(offsets[i] / total, (offsets[i] + counts[i]) / total, r, r0, colors[i]);
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
      const map = new mapboxgl.Map({
        container: mapContainerInternationalRef.current || '',
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

        const transferLocations: any = [...programmeTransferLocations];

        // Calculate color values for each country based on 'hdi' value
        for (const row of transferLocations) {
          // Convert the range of data values to a suitable color
          // const blue = row.ratio * 255;

          const color =
            row.ratio < 0.25
              ? `#FFC343`
              : row.ratio < 0.5
              ? '#FFAC6F'
              : row.ratio < 0.75
              ? '#FF923D'
              : '#FE8163';

          matchExpression.push(row.code, color);
        }

        function getCountryCodes(dataSet: any) {
          return dataSet.map((item: any) => item.code);
        }

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
    }, 1000);
  }, [programmeTransferLocations]);

  useEffect(() => {
    // const address = programmeLocations[0];

    setTimeout(() => {
      if (mapContainerRef.current) {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current || '',
          zoom: 4,
          center: programmeLocations?.features[0]?.geometry?.coordinates
            ? programmeLocations?.features[0]?.geometry?.coordinates
            : [54.44073, 16.39371],
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
              count1: ['+', ['case', count1, 1, 0]],
              count2: ['+', ['case', count2, 1, 0]],
              count3: ['+', ['case', count3, 1, 0]],
              count4: ['+', ['case', count4, 1, 0]],
              count5: ['+', ['case', count5, 1, 0]],
            },
          });
          // circle and symbol layers for rendering individual programmeLocations (unclustered points)
          map.addLayer({
            id: 'programmes_circle',
            type: 'circle',
            source: 'programmeLocations',
            filter: ['!=', 'cluster', true],
            paint: {
              'circle-color': [
                'case',
                count1,
                colors[0],
                count2,
                colors[1],
                count3,
                colors[2],
                count4,
                colors[3],
                colors[4],
              ],
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
              title="Total Programmes"
              options={totalProgrammesOptions}
              series={seriesTotalProgrammesY}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              title="Total Programmes:Sector"
              options={totalProgrammesOptionsSub}
              series={seriesTotalProgrammesSubY}
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
              title="Total Credits"
              options={totalCreditsOptions}
              series={seriesTotalCreditsY}
              lastUpdate={parseInt(lastUpdateProgrammesStats)}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              title="Total Credit Certified"
              options={totalCreditsCertifiedOptions}
              series={seriesTotalCreditsCertifiedY}
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
                  <div className="updated-on argin-top-1">
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
                  <div className="updated-on argin-top-1">
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
