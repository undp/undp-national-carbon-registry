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
  const [transferedProjects, setTransferedProjects] = useState<number>(0);
  const [transfererequestsSent, setTransfererequestsSent] = useState<number>(0);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [creditBalanceWithoutTimeRange, setCreditBalanceWithoutTimeRange] = useState<number>(0);
  const [creditsPieSeries, setCreditPieSeries] = useState<number[]>([1, 1, 0, 0]);
  const [creditsCertifiedPieSeries, setCreditCertifiedPieSeries] = useState<number[]>([1, 1, 0]);
  const [lastUpdate, setLastUpdate] = useState<any>();

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
  const [availableCredits, setAvailableCredits] = useState<number[]>([0, 0, 0, 0]);
  const [issuedCredits, setIssuedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [retiredCredits, setRetiredCredits] = useState<number[]>([0, 0, 0, 0]);
  const [transferredCredits, setTransferredCredits] = useState<number[]>([0, 0, 0, 0]);

  // states for totalCreditsCertified chart
  const [certifiedCredits, setCertifiedCredits] = useState<number[]>([0, 0, 0, 0]);
  const [unCertifiedCredits, setUnCertifiedCredits] = useState<number[]>([0, 0, 0, 0]);

  // locations of programmes
  const [programmeLocations, setProgrammeLocations] = useState<string[]>(['']);

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
          type: 'CREDIT_STATS_BALANCE',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'AWAITING_AUTHORIZATION',
        },
        {
          type: 'TRANSFER_REQUEST_RECEIVED',
        },
        {
          type: 'TRANSFER_REQUEST_SENT',
        },
        {
          type: 'PROGRAMS_CERTIFIED',
        },
        {
          type: 'PROGRAMS_UNCERTIFIED',
        },
      ],
      category: 'overall',
    };
  };

  const getAllProgrammeAnalyticsStatsParams = () => {
    return {
      stats: [
        {
          type: 'TOTAL_PROGRAMS',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'AWAITING_AUTHORIZATION',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'ISSUED',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'REJECTED',
        },
        {
          type: 'PROGRAMS_BY_STATUS',
          value: 'TRANSFERRED',
        },
        {
          type: 'TRANSFER_REQUEST',
        },
        {
          type: 'CREDIT_STATS_BALANCE',
        },
        {
          type: 'CREDIT_STATS_TRANSFERRED',
        },
        {
          type: 'CREDIT_STATS_RETIRED',
        },
        {
          type: 'CREDIT_STATS_ISSUED',
        },
        {
          type: 'CREDIT_CERTIFIED',
        },
        {
          type: 'CREDIT_UNCERTIFIED',
        },
        {
          type: 'CREDIT_REVOKED',
        },
      ],
      category: categoryType,
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
      ],
      category: categoryType,
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

      const availableCredit: any = [];
      const issuedCredit: any = [];
      const retiredCredit: any = [];
      const transferredCredit: any = [];

      const certifiedCredit: any = [];
      const unCertifiedCredit: any = [];

      const response: any = await post(
        'analytics/programme/dashboardCharts',
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
        if (totalCredits?.available) {
          const available = totalCredits?.available;
          available?.map((item: any, index: any) => {
            const credit = Object.values(item);
            availableCredit.push(credit[0]);
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

      setAvailableCredits(availableCredit);
      setIssuedCredits(issuedCredit);
      setRetiredCredits(retiredCredit);
      setTransferredCredits(transferredCredit);
      setCertifiedCredits(certifiedCredit);
      setUnCertifiedCredits(unCertifiedCredit);
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
        'analytics/programme/dashboard',
        getAllProgrammeAnalyticsStatsParamsWithoutTimeRange()
      );
      console.log('stats data  -- > ', response?.data);
      setPendingProjectsWithoutTimeRange(response?.data?.stats?.AWAITING_AUTHORIZATION);
      setCreditBalanceWithoutTimeRange(
        parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum)
      );
      setProgrammesCertifed(response?.data?.stats?.PROGRAMS_CERTIFIED);
      setProgrammesUnCertifed(response?.data?.stats?.PROGRAMS_UNCERTIFIED);
      setTransferRequestSent(response?.data?.stats?.TRANSFER_REQUEST_SENT);
      setTransferRequestReceived(response?.data?.stats?.TRANSFER_REQUEST_RECEIVED);
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
        'analytics/programme/dashboard',
        getAllProgrammeAnalyticsStatsParams()
      );
      console.log('stats data  -- > ', response?.data);
      setPendingProjects(response?.data?.stats?.AWAITING_AUTHORIZATION);
      setIssuedProjects(response?.data?.stats?.ISSUED);
      setRejectedProjects(response?.data?.stats?.REJECTED);
      setTransferedProjects(response?.data?.stats?.TRANSFERRED);
      setTotalProjects(response?.data?.stats?.TOTAL_PROGRAMS);
      setTransfererequestsSent(response?.data?.stats?.TRANSFER_REQUEST);
      setCreditBalance(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_BALANCE?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_TRANSFERRED?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_RETIRED?.sum));
      pieSeriesCreditsData.push(parseFloat(response?.data?.stats?.CREDIT_STATS_ISSUED?.sum));

      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_CERTIFIED?.sum));
      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_UNCERTIFIED?.sum));
      pieSeriesCreditsCerifiedData.push(parseFloat(response?.data?.stats?.CREDIT_REVOKED?.sum));
      // pieSeriesCreditsCerifiedData.push(
      //   parseFloat(response?.data?.stats?.CREDIT_CERTIFIED_ISSUED?.sum)
      // );
      let totalCredits = 0;
      let totalCreditsCertified = 0;
      for (let i = 0; i < pieSeriesCreditsData.length; i++) {
        if (String(pieSeriesCreditsData[i]) === 'NaN') {
          if (i !== -1) {
            pieSeriesCreditsData[i] = 0;
          }
          totalCredits = totalCredits + 0;
        } else {
          totalCredits = totalCredits + pieSeriesCreditsData[i];
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
        '' + addCommSep(totalCredits);
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
      name: 'Enery',
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
      name: 'Available',
      data: availableCredits,
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
  ];

  useEffect(() => {
    console.log('transfr credit --- > ', transferredCredits);
  }, [transferredCredits]);

  useEffect(() => {
    const address = programmeLocations[0];
    setTimeout(() => {
      Geocoding({ accessToken: mapboxgl.accessToken })
        .forwardGeocode({
          query: address,
          autocomplete: false,
          limit: 1,
        })
        .send()
        .then((response: any) => {
          if (
            !response ||
            !response.body ||
            !response.body.features ||
            !response.body.features.length
          ) {
            console.error('Invalid response:');
            console.error(response);
            return;
          }
          const feature = response.body.features[0];
          if (mapContainerRef.current) {
            const map = new mapboxgl.Map({
              container: mapContainerRef.current || '',
              style: 'mapbox://styles/mapbox/streets-v11',
              center: feature.center,
              zoom: 5,
            });
            const popup = new mapboxgl.Popup().setText(address).addTo(map);
            new mapboxgl.Marker().setLngLat(feature.center).addTo(map).setPopup(popup);
          }
        });
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
              updatedDate={lastUpdate}
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
                  ? transfererequestsSent
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
                  <BoxArrowInRight color="#16B1FF" size={80} />
                ) : companyRole === 'ProgrammeDeveloper' ? (
                  <BoxArrowInRight color="#16B1FF" size={80} />
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
                  : certifcationsRevoked
              }
              title={
                companyRole === 'Government'
                  ? 'Credit Balance'
                  : companyRole === 'ProgrammeDeveloper'
                  ? 'Credit Balance'
                  : 'Certification Revoked'
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
              'Last 7 days': [
                moment().startOf('month'),
                moment().startOf('month').add('7', 'days'),
              ],
              'Last 14 days': [
                moment().startOf('month'),
                moment().startOf('month').add('14', 'days'),
              ],
            }}
            showTime
            allowClear={true}
            format="DD:MM:YYYY"
            onChange={onChangeRange}
          />
        </div>
        <div className="radio-selection">
          <Radio.Group value={categoryType} onChange={onChangeCategory}>
            <Radio.Button className="overall" value="overall">
              OVERALL
            </Radio.Button>
            <Radio.Button className="mine" value="mine">
              MINE
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>
      <div className="stastics-and-charts-container center">
        <Row gutter={[40, 40]} className="stastic-card-row">
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <ProgrammeRejectAndTransfer
              totalPrgrammes={totalProjects}
              pending={pendingProjects}
              rejected={rejectedProjects}
              authorized={issuedProjects}
              updatedDate={lastUpdate}
              loading={loading}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <PieChartsStat
              title="Credits"
              options={optionDonutPieA}
              series={creditsPieSeries}
              lastUpdate={lastUpdate}
              loading={loading}
            />
          </Col>
          <Col xxl={8} xl={8} md={12} className="stastic-card-col">
            <PieChartsStat
              title="Certified Credits"
              options={optionDonutPieB}
              series={creditsCertifiedPieSeries}
              lastUpdate={lastUpdate}
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
              lastUpdate={lastUpdate}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              title="Total Programmes:Sector"
              options={totalProgrammesOptionsSub}
              series={seriesTotalProgrammesSubY}
              lastUpdate={lastUpdate}
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
              lastUpdate={lastUpdate}
              loading={loading}
            />
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <BarChartsStat
              title="Total Credit Certified"
              options={totalCreditsCertifiedOptions}
              series={seriesTotalCreditsCertifiedY}
              lastUpdate={lastUpdate}
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
                  <div className="updated-on">
                    <div className="updated-moment-container">
                      {moment(lastUpdate * 1000).fromNow()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col xxl={12} xl={12} md={12} className="stastic-card-col">
            <TransferLocationsMap
              programmeLocations={programmeLocations}
              lastUpdate={lastUpdate}
              loading={loading}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;
